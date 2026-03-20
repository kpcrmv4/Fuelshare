import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { pendingStationSchema } from '@/lib/validations'
import { getClientIP, hashIP } from '@/lib/utils'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('pending_stations')
    .select('*')
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
  const parsed = pendingStationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const supabase = await createServerSupabase()
  const { error } = await supabase
    .from('pending_stations')
    .insert({ ...parsed.data, ip_hash: hashIP(ip) })

  if (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const { id, action, note } = await request.json()

  if (action === 'approve') {
    // Get pending station data
    const { data: pending } = await supabaseAdmin
      .from('pending_stations')
      .select('*')
      .eq('id', id)
      .single()

    if (!pending) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Add to stations
    await supabaseAdmin.from('stations').insert({
      name: pending.name,
      brand: pending.brand ?? 'อื่นๆ',
      location: `POINT(${pending.lng} ${pending.lat})`,
      province: '',
      source: 'manual',
    })

    // Update pending status
    await supabaseAdmin
      .from('pending_stations')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), note })
      .eq('id', id)
  } else {
    await supabaseAdmin
      .from('pending_stations')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString(), note })
      .eq('id', id)
  }

  return NextResponse.json({ success: true })
}
