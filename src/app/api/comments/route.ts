import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { commentSchema } from '@/lib/validations'
import { getClientIP, hashIP } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const stationId = parseInt(searchParams.get('station_id') ?? '')
  const cursor = searchParams.get('cursor')

  if (isNaN(stationId)) {
    return NextResponse.json({ error: 'Invalid station_id' }, { status: 400 })
  }

  const supabase = await createServerSupabase()
  let query = supabase
    .from('comments')
    .select('id, station_id, message, created_at')
    .eq('station_id', stationId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = commentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const ip = getClientIP(request)
  const ipHash = hashIP(ip)

  // Check 3/station/person/day limit
  const supabase = await createServerSupabase()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count, error: countError } = await supabase
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('station_id', parsed.data.station_id)
    .eq('ip_hash', ipHash)
    .gte('created_at', todayStart.toISOString())

  if (countError) {
    return NextResponse.json({ error: 'Failed to check limit' }, { status: 500 })
  }

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: 'ส่งข้อความได้ไม่เกิน 3 ครั้ง/ปั๊ม/วัน' }, { status: 429 })
  }

  const { error } = await supabase
    .from('comments')
    .insert({
      station_id: parsed.data.station_id,
      message: parsed.data.message,
      ip_hash: ipHash,
    })

  if (error) {
    return NextResponse.json({ error: 'Failed to save comment' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
