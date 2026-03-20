import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const stationId = parseInt(id)
  if (isNaN(stationId)) {
    return NextResponse.json({ error: 'Invalid station ID' }, { status: 400 })
  }

  const { searchParams } = request.nextUrl
  const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null
  const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null

  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('get_station_detail', {
    p_station_id: stationId,
    user_lat: lat,
    user_lng: lng,
  })

  if (error) {
    console.error('station detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch station' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Station not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const stationId = parseInt(id)
  if (isNaN(stationId)) {
    return NextResponse.json({ error: 'Invalid station ID' }, { status: 400 })
  }

  const body = await request.json()
  const supabase = await createServerSupabase()

  const { error } = await supabase
    .from('stations')
    .update({ is_open: body.is_open, updated_at: new Date().toISOString() })
    .eq('id', stationId)

  if (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
