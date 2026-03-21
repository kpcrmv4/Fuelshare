'use client'

import { useEffect, useState, useCallback } from 'react'
import { ToastProvider, useToast } from '@/components/ui/Toast'

type Tab = 'dashboard' | 'pending' | 'removal' | 'comments' | 'staff' | 'import'

interface AdminStats {
  totalStations: number
  brandCounts: Record<string, number>
  totalReports: number
  todayReports: number
  pendingCount: number
  removalCount: number
  commentCount: number
  unverifiedStaff: number
}

function AdminContent() {
  const { show: toast } = useToast()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [pending, setPending] = useState<any[]>([])
  const [removals, setRemovals] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  // Single area import
  const [importLat, setImportLat] = useState('')
  const [importLng, setImportLng] = useState('')
  const [importRadius, setImportRadius] = useState('20')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  // Bulk import
  const [bulkInfo, setBulkInfo] = useState<any>(null)
  const [bulkRunning, setBulkRunning] = useState(false)
  const [bulkBatch, setBulkBatch] = useState(0)
  const [bulkTotal, setBulkTotal] = useState(0)
  const [bulkImported, setBulkImported] = useState(0)
  const [bulkFound, setBulkFound] = useState(0)
  const [bulkLog, setBulkLog] = useState<string[]>([])
  const bulkAbortRef = { current: false }

  const loadBulkInfo = useCallback(async () => {
    const res = await fetch('/api/admin/import-bulk')
    if (res.ok) setBulkInfo(await res.json())
  }, [])

  const handleBulkStart = async () => {
    bulkAbortRef.current = false
    setBulkRunning(true)
    setBulkBatch(0)
    setBulkImported(0)
    setBulkFound(0)
    setBulkLog([])

    const info = bulkInfo
    if (!info) return

    setBulkTotal(info.total_batches)
    const pwd = sessionStorage.getItem('admin_pwd') ?? ''

    for (let i = 0; i < info.total_batches; i++) {
      if (bulkAbortRef.current) {
        setBulkLog((prev) => [...prev, `⏹ หยุดที่ batch ${i}`])
        break
      }
      try {
        const res = await fetch('/api/admin/import-bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd, batch_index: i }),
        })
        const data = await res.json()
        if (!res.ok) {
          setBulkLog((prev) => [...prev, `❌ Batch ${i}: ${data.error}`])
          break
        }
        setBulkBatch(i + 1)
        setBulkImported((prev) => prev + data.imported)
        setBulkFound((prev) => prev + data.found)
        if (data.imported > 0 || data.found > 0) {
          setBulkLog((prev) => [...prev, `✅ Batch ${i + 1}/${info.total_batches}: +${data.imported} ปั๊ม (พบ ${data.found}, ข้าม ${data.skipped})`])
        }
        if (data.errors?.length > 0) {
          setBulkLog((prev) => [...prev, ...data.errors.map((e: string) => `⚠️ ${e}`)])
        }
      } catch {
        setBulkLog((prev) => [...prev, `❌ Batch ${i}: Network error`])
        break
      }
    }

    setBulkRunning(false)
    loadStats()
    toast('Import ทั่วประเทศเสร็จสิ้น', 'success')
  }

  const handleBulkStop = () => {
    bulkAbortRef.current = true
  }

  const handleImport = async () => {
    if (!importLat || !importLng) {
      toast('กรุณาระบุพิกัด', 'error')
      return
    }
    setImporting(true)
    setImportResult(null)
    try {
      const res = await fetch('/api/admin/import-stations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: sessionStorage.getItem('admin_pwd') ?? '',
          lat: parseFloat(importLat),
          lng: parseFloat(importLng),
          radius_km: parseFloat(importRadius),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error ?? 'เกิดข้อผิดพลาด', 'error')
        return
      }
      setImportResult(data)
      toast(`นำเข้า ${data.imported} ปั๊ม (ข้าม ${data.skipped})`, 'success')
      loadStats()
    } finally {
      setImporting(false)
    }
  }

  const handleUseMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setImportLat(String(pos.coords.latitude))
        setImportLng(String(pos.coords.longitude))
        toast('ได้พิกัดแล้ว', 'success')
      },
      () => toast('ไม่สามารถรับตำแหน่งได้', 'error')
    )
  }

  const loadStats = useCallback(async () => {
    const res = await fetch('/api/admin/stats')
    if (res.ok) setStats(await res.json())
  }, [])

  const loadPending = useCallback(async () => {
    const res = await fetch('/api/pending')
    if (res.ok) setPending(await res.json())
  }, [])

  const loadRemovals = useCallback(async () => {
    const res = await fetch('/api/removal')
    if (res.ok) setRemovals(await res.json())
  }, [])

  const loadComments = useCallback(async () => {
    const res = await fetch('/api/admin/comments')
    if (res.ok) setComments(await res.json())
  }, [])

  const loadStaff = useCallback(async () => {
    const res = await fetch('/api/admin/staff')
    if (res.ok) setStaffList(await res.json())
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    if (tab === 'pending') loadPending()
    if (tab === 'removal') loadRemovals()
    if (tab === 'comments') loadComments()
    if (tab === 'staff') loadStaff()
    if (tab === 'import') loadBulkInfo()
  }, [tab, loadPending, loadRemovals, loadComments, loadStaff, loadBulkInfo])

  const handlePending = async (id: number, action: 'approve' | 'reject') => {
    await fetch('/api/pending', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    toast(action === 'approve' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว', 'success')
    loadPending()
    loadStats()
  }

  const handleRemoval = async (id: number, action: 'approve' | 'reject') => {
    await fetch('/api/removal', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    toast(action === 'approve' ? 'ลบปั๊มแล้ว' : 'ปฏิเสธแล้ว', 'success')
    loadRemovals()
    loadStats()
  }

  const handleDeleteComment = async (id: number) => {
    await fetch('/api/admin/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    toast('ลบแล้ว', 'success')
    loadComments()
  }

  const handleVerifyStaff = async (id: number, verified: boolean) => {
    await fetch('/api/admin/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, verified }),
    })
    toast(verified ? 'ยืนยันแล้ว' : 'ยกเลิกการยืนยัน', 'success')
    loadStaff()
    loadStats()
  }

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'dashboard', label: 'สถิติ' },
    { key: 'pending', label: 'รอเพิ่ม', badge: stats?.pendingCount },
    { key: 'removal', label: 'รอลบ', badge: stats?.removalCount },
    { key: 'comments', label: 'ความเห็น', badge: stats?.commentCount },
    { key: 'staff', label: 'เจ้าของปั๊ม', badge: stats?.unverifiedStaff },
    { key: 'import', label: 'นำเข้าปั๊ม' },
  ]

  return (
    <div className="min-h-dvh bg-bg">
      {/* Header */}
      <header className="bg-surface border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-base font-bold text-text">Admin Panel</h1>
        <a href="/" className="text-sm text-muted hover:text-accent">หน้าหลัก</a>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
              ${tab === t.key ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-sub'}`}
          >
            {t.label}
            {t.badge ? (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {/* Dashboard */}
        {tab === 'dashboard' && stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'ปั๊มทั้งหมด', value: stats.totalStations, color: 'text-blue-600' },
                { label: 'รายงานวันนี้', value: stats.todayReports, color: 'text-orange-600' },
                { label: 'รายงานทั้งหมด', value: stats.totalReports, color: 'text-purple-600' },
                { label: 'ความคิดเห็น', value: stats.commentCount, color: 'text-green-600' },
              ].map((s) => (
                <div key={s.label} className="bg-surface rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-surface rounded-xl p-4 border border-border">
              <h3 className="text-sm font-semibold mb-3">แบรนด์ปั๊ม</h3>
              {Object.entries(stats.brandCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([brand, count]) => (
                  <div key={brand} className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-sub">{brand}</span>
                    <span className="text-text font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        ) : null}

        {/* Pending */}
        {tab === 'pending' ? (
          <div className="space-y-3">
            {pending.length === 0 ? (
              <p className="text-center text-muted py-8">ไม่มีคำขอรอดำเนินการ</p>
            ) : null}
            {pending.map((p: any) => (
              <div key={p.id} className="bg-surface rounded-xl p-4 border border-border">
                <p className="font-semibold text-text">{p.name}</p>
                <p className="text-xs text-muted">{p.brand} · ({p.lat}, {p.lng})</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handlePending(p.id, 'approve')}
                    className="px-4 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium"
                  >
                    อนุมัติ
                  </button>
                  <button
                    onClick={() => handlePending(p.id, 'reject')}
                    className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium"
                  >
                    ปฏิเสธ
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Removal */}
        {tab === 'removal' ? (
          <div className="space-y-3">
            {removals.length === 0 ? (
              <p className="text-center text-muted py-8">ไม่มีคำขอลบ</p>
            ) : null}
            {removals.map((r: any) => (
              <div key={r.id} className="bg-surface rounded-xl p-4 border border-border">
                <p className="font-semibold text-text">{r.stations?.name ?? `Station #${r.station_id}`}</p>
                <p className="text-xs text-muted mt-1">เหตุผล: {r.reason}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleRemoval(r.id, 'approve')}
                    className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium"
                  >
                    ลบปั๊ม
                  </button>
                  <button
                    onClick={() => handleRemoval(r.id, 'reject')}
                    className="px-4 py-1.5 border border-border rounded-lg text-xs font-medium text-sub"
                  >
                    ปฏิเสธ
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Comments */}
        {tab === 'comments' ? (
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-center text-muted py-8">ไม่มีความคิดเห็น</p>
            ) : null}
            {comments.map((c: any) => (
              <div key={c.id} className="bg-surface rounded-xl p-4 border border-border">
                <p className="text-sm text-text">{c.message}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted">{new Date(c.created_at).toLocaleString('th-TH')}</span>
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Import */}
        {tab === 'import' ? (
          <div className="space-y-4">
            {/* Bulk import - whole country */}
            <div className="bg-surface rounded-xl p-4 border border-border space-y-3">
              <h3 className="text-sm font-semibold text-text">Import ทั่วประเทศ</h3>
              <p className="text-xs text-muted">
                สแกน grid ทั่วประเทศไทยด้วย Google Places API อัตโนมัติ ระบบจะแบ่งเป็น batch ทำงานต่อเนื่อง
              </p>

              {bulkInfo ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-surface-hover rounded-lg p-2">
                    <span className="text-muted">จุดสแกน:</span> <span className="text-text font-medium">{bulkInfo.total_points}</span>
                  </div>
                  <div className="bg-surface-hover rounded-lg p-2">
                    <span className="text-muted">Batches:</span> <span className="text-text font-medium">{bulkInfo.total_batches}</span>
                  </div>
                  <div className="bg-surface-hover rounded-lg p-2">
                    <span className="text-muted">รัศมีค้นหา:</span> <span className="text-text font-medium">{bulkInfo.search_radius_km} กม.</span>
                  </div>
                  <div className="bg-surface-hover rounded-lg p-2">
                    <span className="text-muted">ค่า API โดยประมาณ:</span> <span className="text-text font-medium">{bulkInfo.estimated_cost}</span>
                  </div>
                </div>
              ) : null}

              {bulkRunning ? (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Batch {bulkBatch}/{bulkTotal}</span>
                      <span className="text-accent font-medium">{bulkTotal > 0 ? Math.round((bulkBatch / bulkTotal) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-surface-hover rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full transition-all duration-300"
                        style={{ width: `${bulkTotal > 0 ? (bulkBatch / bulkTotal) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className="text-green-500">นำเข้า: {bulkImported}</span>
                      <span className="text-muted">พบ: {bulkFound}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleBulkStop}
                    className="w-full bg-red-500 text-white py-2.5 rounded-xl font-medium text-sm"
                  >
                    หยุด Import
                  </button>
                </>
              ) : (
                <button
                  onClick={handleBulkStart}
                  disabled={!bulkInfo}
                  className="w-full bg-accent text-white py-2.5 rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-50"
                >
                  เริ่ม Import ทั่วประเทศ
                </button>
              )}

              {bulkLog.length > 0 ? (
                <div className="max-h-48 overflow-y-auto bg-surface-hover rounded-lg p-2 space-y-0.5">
                  {bulkLog.map((log, i) => (
                    <p key={i} className="text-[11px] text-muted">{log}</p>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Single area import */}
            <div className="bg-surface rounded-xl p-4 border border-border space-y-3">
              <h3 className="text-sm font-semibold text-text">Import จุดเดียว</h3>
              <p className="text-xs text-muted">ระบุพิกัดและรัศมี ดึงปั๊มสูงสุด 20 แห่ง/ครั้ง</p>
              <button
                onClick={handleUseMyLocation}
                className="text-xs text-accent hover:underline"
              >
                ใช้ตำแหน่งปัจจุบัน
              </button>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted">Latitude</label>
                  <input
                    type="text"
                    value={importLat}
                    onChange={(e) => setImportLat(e.target.value)}
                    placeholder="18.7883"
                    className="w-full bg-surface-hover rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Longitude</label>
                  <input
                    type="text"
                    value={importLng}
                    onChange={(e) => setImportLng(e.target.value)}
                    placeholder="98.9853"
                    className="w-full bg-surface-hover rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">รัศมี (กม.)</label>
                  <input
                    type="text"
                    value={importRadius}
                    onChange={(e) => setImportRadius(e.target.value)}
                    className="w-full bg-surface-hover rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              </div>
              <button
                onClick={handleImport}
                disabled={importing}
                className="w-full bg-surface-hover text-text py-2.5 rounded-xl font-medium text-sm border border-border hover:border-accent/30 disabled:opacity-50"
              >
                {importing ? 'กำลังนำเข้า...' : 'Import จุดเดียว'}
              </button>
            </div>

            {importResult ? (
              <div className="bg-surface rounded-xl p-4 border border-border space-y-2">
                <div className="flex gap-4 text-sm">
                  <span className="text-muted">พบ: <span className="text-text font-medium">{importResult.total_found}</span></span>
                  <span className="text-green-500">นำเข้า: <span className="font-medium">{importResult.imported}</span></span>
                  <span className="text-muted">ข้าม: <span className="font-medium">{importResult.skipped}</span></span>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {importResult.results?.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border last:border-0">
                      <div>
                        <span className="text-text">{r.name}</span>
                        <span className="text-muted ml-2">{r.brand}</span>
                      </div>
                      <span className={r.status === 'imported' ? 'text-green-500' : r.status === 'duplicate' ? 'text-yellow-500' : 'text-red-400'}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Staff */}
        {tab === 'staff' ? (
          <div className="space-y-3">
            {staffList.length === 0 ? (
              <p className="text-center text-muted py-8">ไม่มีเจ้าของปั๊ม</p>
            ) : null}
            {staffList.map((s: any) => (
              <div key={s.id} className="bg-surface rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-text">{s.display_name ?? 'ไม่ระบุชื่อ'}</p>
                    <p className="text-xs text-muted">
                      {s.stations?.name ?? `Station #${s.station_id}`} · {s.role}
                    </p>
                  </div>
                  <button
                    onClick={() => handleVerifyStaff(s.id, !s.verified)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                      ${s.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                  >
                    {s.verified ? 'ยืนยันแล้ว' : 'ยืนยัน'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <ToastProvider>
      <AdminContent />
    </ToastProvider>
  )
}
