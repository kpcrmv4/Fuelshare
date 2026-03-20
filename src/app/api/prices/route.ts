import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { priceSchema } from '@/lib/validations'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIP, hashIP } from '@/lib/utils'
import { RATE_LIMITS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  const { allowed } = checkRateLimit(`price:${ip}`, RATE_LIMITS.price.max, RATE_LIMITS.price.windowMs)
  if (!allowed) {
    return NextResponse.json({ error: 'รายงานราคาบ่อยเกินไป' }, { status: 429 })
  }

  const body = await request.json()
  const parsed = priceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const supabase = await createServerSupabase()
  const { error } = await supabase
    .from('fuel_prices')
    .insert({
      station_id: parsed.data.station_id,
      fuel_type: parsed.data.fuel_type,
      price: parsed.data.price,
      reported_by_role: 'anonymous',
      ip_hash: hashIP(ip),
    })

  if (error) {
    return NextResponse.json({ error: 'Failed to save price' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
