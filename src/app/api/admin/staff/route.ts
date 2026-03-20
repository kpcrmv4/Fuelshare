import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('station_staff')
    .select('*, stations(name, brand)')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
  return NextResponse.json(data ?? [])
}

export async function PATCH(request: NextRequest) {
  const { id, verified } = await request.json()

  const { error } = await supabaseAdmin
    .from('station_staff')
    .update({ verified })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
