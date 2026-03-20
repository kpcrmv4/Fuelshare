import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { limitSchema } from '@/lib/validations'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIP, hashIP } from '@/lib/utils'
import { RATE_LIMITS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  const { allowed } = checkRateLimit(`report:${ip}`, RATE_LIMITS.report.max, RATE_LIMITS.report.windowMs)
  if (!allowed) {
    return NextResponse.json({ error: 'รายงานบ่อยเกินไป' }, { status: 429 })
  }

  const body = await request.json()
  const parsed = limitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const supabase = await createServerSupabase()
  const { error } = await supabase
    .from('station_limits')
    .insert({
      station_id: parsed.data.station_id,
      fuel_type: parsed.data.fuel_type,
      limit_type: parsed.data.limit_type,
      limit_amount: parsed.data.limit_amount,
      reported_by_role: 'anonymous',
      ip_hash: hashIP(ip),
    })

  if (error) {
    return NextResponse.json({ error: 'Failed to save limit' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
