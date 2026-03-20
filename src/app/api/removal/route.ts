import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { removalSchema } from '@/lib/validations'
import { getClientIP, hashIP } from '@/lib/utils'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('removal_requests')
    .select('*, stations(name, brand)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  const body = await request.json()
  const parsed = removalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const supabase = await createServerSupabase()
  const { error } = await supabase
    .from('removal_requests')
    .insert({ ...parsed.data, ip_hash: hashIP(ip) })

  if (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const { id, action } = await request.json()

  if (action === 'approve') {
    const { data: req } = await supabaseAdmin
      .from('removal_requests')
      .select('station_id')
      .eq('id', id)
      .single()

    if (req) {
      await supabaseAdmin
        .from('stations')
        .update({ status: 'removed', updated_at: new Date().toISOString() })
        .eq('id', req.station_id)
    }
  }

  await supabaseAdmin
    .from('removal_requests')
    .update({ status: action === 'approve' ? 'approved' : 'rejected' })
    .eq('id', id)

  return NextResponse.json({ success: true })
}
