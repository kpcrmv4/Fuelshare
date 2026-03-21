import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createHash } from 'crypto'

export async function POST(request: NextRequest) {
  const { name, lat, lng, note } = await request.json()

  if (!name?.trim() || !lat || !lng) {
    return NextResponse.json({ error: 'กรุณาระบุชื่อปั๊มและตำแหน่ง' }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 16)

  // Rate limit: 3 requests per day per IP
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count } = await supabaseAdmin
    .from('station_requests')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', todayStart.toISOString())

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: 'ส่งคำขอได้ไม่เกิน 3 ครั้ง/วัน' }, { status: 429 })
  }

  const { error } = await supabaseAdmin.from('station_requests').insert({
    name: name.trim(),
    lat,
    lng,
    note: note?.trim() ?? '',
    ip_hash: ipHash,
  })

  if (error) {
    return NextResponse.json({ error: 'บันทึกไม่สำเร็จ' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
