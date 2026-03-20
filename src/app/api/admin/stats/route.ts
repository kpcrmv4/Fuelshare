import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const [stations, reports, pending, removal, comments, staff] = await Promise.all([
    supabaseAdmin.from('stations').select('id, brand, status').eq('status', 'active'),
    supabaseAdmin.from('fuel_status').select('id, created_at'),
    supabaseAdmin.from('pending_stations').select('id').eq('status', 'pending'),
    supabaseAdmin.from('removal_requests').select('id').eq('status', 'pending'),
    supabaseAdmin.from('comments').select('id'),
    supabaseAdmin.from('station_staff').select('id, verified'),
  ])

  const stationList = stations.data ?? []
  const brandCounts: Record<string, number> = {}
  for (const s of stationList) {
    brandCounts[s.brand] = (brandCounts[s.brand] ?? 0) + 1
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const reportList = reports.data ?? []
  const todayReports = reportList.filter((r) => new Date(r.created_at) >= todayStart).length

  const staffList = staff.data ?? []
  const unverifiedStaff = staffList.filter((s) => !s.verified).length

  return NextResponse.json({
    totalStations: stationList.length,
    brandCounts,
    totalReports: reportList.length,
    todayReports,
    pendingCount: pending.data?.length ?? 0,
    removalCount: removal.data?.length ?? 0,
    commentCount: comments.data?.length ?? 0,
    unverifiedStaff,
  })
}
