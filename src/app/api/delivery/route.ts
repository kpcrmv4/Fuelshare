import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { deliverySchema } from '@/lib/validations'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIP, hashIP } from '@/lib/utils'
import { RATE_LIMITS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  const { allowed } = checkRateLimit(`report:${ip}`, RATE_LIMITS.report.max, RATE_LIMITS.report.windowMs)
  if (!allowed) {
    return NextResponse.json({ error: 'รายงานบ่อยเกินไป กรุณารอสักครู่' }, { status: 429 })
  }

  const body = await request.json()
  const parsed = deliverySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('next_delivery')
    .insert({
      station_id: parsed.data.station_id,
      fuel_type: parsed.data.fuel_type,
      delivery_date: parsed.data.delivery_date,
      delivery_time_slot: parsed.data.delivery_time_slot,
      delivery_time: parsed.data.delivery_time,
      ip_hash: hashIP(ip),
      reported_by_role: 'anonymous',
    })
    .select('id')
    .single()

  if (error) {
    console.error('delivery error:', error)
    return NextResponse.json({ error: 'Failed to save delivery' }, { status: 500 })
  }

  return NextResponse.json({ success: true, id: data.id })
}
