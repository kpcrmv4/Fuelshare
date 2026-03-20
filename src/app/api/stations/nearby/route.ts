import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')
  const radius = parseInt(searchParams.get('r') ?? '20000')

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }

  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('get_nearby_stations', {
    user_lat: lat,
    user_lng: lng,
    radius_m: Math.min(radius, 50000),
    max_results: 50,
  })

  if (error) {
    console.error('nearby error:', error)
    return NextResponse.json({ error: 'Failed to fetch stations' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
