import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? ''

// Brand detection from station name
const BRAND_PATTERNS: [RegExp, string][] = [
  [/\bptt\b|พีทีที|ปตท/i, 'PTT'],
  [/\bshell\b|เชลล์/i, 'Shell'],
  [/\bcaltex\b|คาลเท็กซ์/i, 'Caltex'],
  [/\bbangchak\b|บางจาก|bcp\b/i, 'Bangchak'],
  [/\besso\b|เอสโซ่?/i, 'Esso'],
  [/\bsusco\b|ซัสโก้/i, 'Susco'],
  [/\bpt\b|พีที/i, 'PT'],
]

function detectBrand(name: string): string {
  for (const [pattern, brand] of BRAND_PATTERNS) {
    if (pattern.test(name)) return brand
  }
  return 'อื่นๆ'
}

interface PlaceResult {
  id: string
  displayName?: { text: string }
  formattedAddress?: string
  location?: { latitude: number; longitude: number }
  regularOpeningHours?: { periods: unknown[] }
}

async function searchNearby(lat: number, lng: number, radiusM: number): Promise<PlaceResult[]> {
  const url = 'https://places.googleapis.com/v1/places:searchNearby'
  const body = {
    includedTypes: ['gas_station'],
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radiusM,
      },
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.regularOpeningHours',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Places API error: ${res.status} ${err}`)
  }

  const data = await res.json()
  return data.places ?? []
}

export async function POST(request: NextRequest) {
  // Admin auth check
  const { password, lat, lng, radius_km } = await request.json()
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'your-google-api-key') {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 500 })
  }

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })
  }

  const radiusM = (radius_km ?? 20) * 1000

  try {
    const places = await searchNearby(lat, lng, radiusM)

    const supabase = await createServerSupabase()

    // Get existing place_ids to avoid duplicates
    const { data: existing } = await supabase
      .from('stations')
      .select('place_id')
      .not('place_id', 'is', null)

    const existingIds = new Set((existing ?? []).map((s) => s.place_id))

    let imported = 0
    let skipped = 0
    const results: { name: string; brand: string; status: string }[] = []

    for (const place of places) {
      const placeId = place.id
      if (!placeId || !place.location) {
        skipped++
        results.push({ name: place.displayName?.text ?? '?', brand: '?', status: 'skipped (no location)' })
        continue
      }

      if (existingIds.has(placeId)) {
        skipped++
        results.push({ name: place.displayName?.text ?? '?', brand: '?', status: 'duplicate' })
        continue
      }

      const name = place.displayName?.text ?? 'ปั๊มน้ำมัน'
      const brand = detectBrand(name)
      const address = place.formattedAddress ?? ''

      // Extract province from address (last part before postal code in Thai addresses)
      const addressParts = address.split(/[,\s]+/)
      const province = addressParts.length > 2 ? addressParts[addressParts.length - 2] : 'ไม่ระบุ'

      const { error } = await supabase.from('stations').insert({
        place_id: placeId,
        name,
        brand,
        location: `SRID=4326;POINT(${place.location.longitude} ${place.location.latitude})`,
        address,
        province,
        is_open: true,
        source: 'google_maps',
        status: 'active',
      })

      if (error) {
        results.push({ name, brand, status: `error: ${error.message}` })
      } else {
        imported++
        existingIds.add(placeId)
        results.push({ name, brand, status: 'imported' })
      }
    }

    return NextResponse.json({
      total_found: places.length,
      imported,
      skipped,
      results,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
