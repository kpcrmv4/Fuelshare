import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? ''

// Grid covering Thailand
// Lat: 5.6 → 20.5, step 0.27° (~30km)
// Lng: 97.3 → 105.7, step 0.28° (~30km)
const LAT_START = 5.6
const LAT_END = 20.5
const LAT_STEP = 0.27
const LNG_START = 97.3
const LNG_END = 105.7
const LNG_STEP = 0.28

const SEARCH_RADIUS_M = 20000 // 20km
const BATCH_SIZE = 5

// Pre-compute all grid points
function generateGridPoints(): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = []
  for (let lat = LAT_START; lat <= LAT_END; lat += LAT_STEP) {
    for (let lng = LNG_START; lng <= LNG_END; lng += LNG_STEP) {
      if (isRoughlyInThailand(lat, lng)) {
        points.push({ lat: Math.round(lat * 10000) / 10000, lng: Math.round(lng * 10000) / 10000 })
      }
    }
  }
  return points
}

// Rough filter: skip obvious ocean/non-Thailand points
function isRoughlyInThailand(lat: number, lng: number): boolean {
  // Southern Thailand (peninsula) - narrower
  if (lat < 7) return lng >= 99.0 && lng <= 102.5
  if (lat < 10) return lng >= 98.0 && lng <= 103.0
  if (lat < 12) return lng >= 98.5 && lng <= 103.5
  // Central/Eastern Thailand
  if (lat < 14) return lng >= 98.5 && lng <= 105.7
  // Northern/Northeastern
  if (lat < 16) return lng >= 98.0 && lng <= 105.7
  if (lat < 18) return lng >= 97.5 && lng <= 105.0
  if (lat < 20) return lng >= 97.5 && lng <= 104.5
  return lng >= 99.0 && lng <= 104.0
}

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

async function searchNearby(lat: number, lng: number) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
    },
    body: JSON.stringify({
      includedTypes: ['gas_station'],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: SEARCH_RADIUS_M,
        },
      },
    }),
  })

  if (!res.ok) return []
  const data = await res.json()
  return data.places ?? []
}

// GET: return grid info
export async function GET() {
  const points = generateGridPoints()
  const totalBatches = Math.ceil(points.length / BATCH_SIZE)
  return NextResponse.json({
    total_points: points.length,
    batch_size: BATCH_SIZE,
    total_batches: totalBatches,
    estimated_cost: `$${(points.length * 0.032).toFixed(2)}`,
    search_radius_km: SEARCH_RADIUS_M / 1000,
    grid_step_km: 30,
  })
}

// POST: process one batch
export async function POST(request: NextRequest) {
  const { password, batch_index } = await request.json()

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'your-google-api-key') {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 500 })
  }

  const points = generateGridPoints()
  const totalBatches = Math.ceil(points.length / BATCH_SIZE)

  if (batch_index < 0 || batch_index >= totalBatches) {
    return NextResponse.json({ error: 'Invalid batch_index', total_batches: totalBatches }, { status: 400 })
  }

  const batchPoints = points.slice(batch_index * BATCH_SIZE, (batch_index + 1) * BATCH_SIZE)

  const supabase = await createServerSupabase()

  // Get all existing place_ids
  const { data: existing } = await supabase
    .from('stations')
    .select('place_id')
    .not('place_id', 'is', null)
  const existingIds = new Set((existing ?? []).map((s) => s.place_id))

  let imported = 0
  let skipped = 0
  let found = 0

  for (const point of batchPoints) {
    const places = await searchNearby(point.lat, point.lng)
    found += places.length

    for (const place of places) {
      if (!place.id || !place.location || existingIds.has(place.id)) {
        skipped++
        continue
      }

      const name = place.displayName?.text ?? 'ปั๊มน้ำมัน'
      const brand = detectBrand(name)
      const address = place.formattedAddress ?? ''
      const addressParts = address.split(/[,\s]+/)
      const province = addressParts.length > 2 ? addressParts[addressParts.length - 2] : 'ไม่ระบุ'

      const { error } = await supabase.from('stations').insert({
        place_id: place.id,
        name,
        brand,
        location: `SRID=4326;POINT(${place.location.longitude} ${place.location.latitude})`,
        address,
        province,
        is_open: true,
        source: 'google_maps',
        status: 'active',
      })

      if (!error) {
        imported++
        existingIds.add(place.id)
      }
      skipped += error ? 1 : 0
    }
  }

  return NextResponse.json({
    batch_index,
    total_batches: totalBatches,
    points_scanned: batchPoints.length,
    found,
    imported,
    skipped,
    progress_percent: Math.round(((batch_index + 1) / totalBatches) * 100),
    done: batch_index + 1 >= totalBatches,
  })
}
