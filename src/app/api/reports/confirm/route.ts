import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIP } from '@/lib/utils'
import { RATE_LIMITS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  const { allowed } = checkRateLimit(`vote:${ip}`, RATE_LIMITS.vote.max, RATE_LIMITS.vote.windowMs)
  if (!allowed) {
    return NextResponse.json({ error: 'โหวตบ่อยเกินไป' }, { status: 429 })
  }

  const { status_id } = await request.json()
  if (!status_id || typeof status_id !== 'number') {
    return NextResponse.json({ error: 'Invalid status_id' }, { status: 400 })
  }

  // Read current votes then increment (using admin to bypass RLS for update)
  const { data: current } = await supabaseAdmin
    .from('fuel_status')
    .select('votes_confirm')
    .eq('id', status_id)
    .single()

  if (!current) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  const { error } = await supabaseAdmin
    .from('fuel_status')
    .update({ votes_confirm: (current.votes_confirm ?? 0) + 1 })
    .eq('id', status_id)

  if (error) {
    return NextResponse.json({ error: 'Failed to confirm' }, { status: 500 })
  }

  return NextResponse.json({ success: true, votes: (current.votes_confirm ?? 0) + 1 })
}
