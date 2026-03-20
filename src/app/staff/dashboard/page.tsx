'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FUEL_TYPES, STATUS_CONFIG, QUEUE_CONFIG, type FuelType } from '@/lib/constants'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import type { StationStaff, Station } from '@/lib/supabase/types'

function DashboardContent() {
  const router = useRouter()
  const { show: toast } = useToast()
  const supabase = createClient()

  const [staff, setStaff] = useState<StationStaff | null>(null)
  const [station, setStation] = useState<Station | null>(null)
  const [loading, setLoading] = useState(true)

  // Report form state
  const [selectedFuel, setSelectedFuel] = useState<string>('')
  const [status, setStatus] = useState<'available' | 'queue' | 'out'>('available')
  const [queueLevel, setQueueLevel] = useState<'none' | 'low' | 'medium' | 'high'>('none')
  const [price, setPrice] = useState('')
  const [limitType, setLimitType] = useState<'liters' | 'baht' | ''>('')
  const [limitAmount, setLimitAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: staffData } = await supabase
      .from('station_staff')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (!staffData) {
      setLoading(false)
      return
    }
    setStaff(staffData as unknown as StationStaff)

    // Fetch station detail
    const res = await fetch(`/api/stations/${staffData.station_id}`)
    if (res.ok) {
      const data = await res.json()
      setStation(data)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/staff/login')
  }

  const handleSubmit = async () => {
    if (!staff || !selectedFuel) return
    setSubmitting(true)

    try {
      const role = staff.verified ? 'owner' : 'anonymous'
      const promises: Promise<Response>[] = []

      // Status report
      promises.push(fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_id: staff.station_id,
          fuel_type: selectedFuel,
          status,
          queue_level: status === 'queue' ? queueLevel : 'none',
        }),
      }))

      // Price
      if (price) {
        promises.push(fetch('/api/prices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            station_id: staff.station_id,
            fuel_type: selectedFuel,
            price: parseFloat(price),
          }),
        }))
      }

      // Limit
      if (limitType && limitAmount) {
        promises.push(fetch('/api/limits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            station_id: staff.station_id,
            fuel_type: selectedFuel,
            limit_type: limitType,
            limit_amount: parseInt(limitAmount),
          }),
        }))
      }

      await Promise.all(promises)
      toast('อัปเดตสำเร็จ!', 'success')
      loadData()
      setSelectedFuel('')
      setPrice('')
      setLimitType('')
      setLimitAmount('')
    } catch {
      toast('เกิดข้อผิดพลาด', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleOpen = async () => {
    if (!staff || !station) return
    const res = await fetch(`/api/stations/${staff.station_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_open: !station.is_open }),
    })
    if (res.ok) {
      toast(station.is_open ? 'ปิดปั๊มแล้ว' : 'เปิดปั๊มแล้ว', 'success')
      loadData()
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-text mb-2">ไม่พบข้อมูลปั๊ม</p>
          <p className="text-sm text-muted mb-4">คุณยังไม่ได้ลงทะเบียนเป็นเจ้าของปั๊ม</p>
          <a href="/staff/register" className="text-accent hover:underline">ลงทะเบียน</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-bg">
      {/* Header */}
      <header className="bg-surface border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-base font-bold text-text">แดชบอร์ดเจ้าของปั๊ม</h1>
          <p className="text-xs text-muted">{staff.display_name ?? 'เจ้าของปั๊ม'}</p>
        </div>
        <div className="flex items-center gap-2">
          {staff.verified ? (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">ยืนยันแล้ว</span>
          ) : (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">รอยืนยัน</span>
          )}
          <button onClick={handleLogout} className="text-xs text-muted hover:text-red-500">ออก</button>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Station info */}
        {station ? (
          <div className="bg-surface rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-text">{station.name}</h2>
              <button
                onClick={toggleOpen}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                  ${station.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}
              >
                {station.is_open ? 'เปิดอยู่' : 'ปิดอยู่'} — กดเปลี่ยน
              </button>
            </div>
            <p className="text-xs text-muted">{station.brand} · {station.address}</p>

            {/* Current fuel status */}
            {station.fuel_data.length > 0 ? (
              <div className="mt-3 space-y-1">
                {station.fuel_data.map((f) => {
                  const fuelInfo = FUEL_TYPES[f.fuel_type as FuelType]
                  const statusInfo = STATUS_CONFIG[f.status]
                  return (
                    <div key={f.fuel_type} className="flex items-center justify-between text-xs">
                      <span className="text-sub">{fuelInfo?.name ?? f.fuel_type}</span>
                      <span style={{ color: statusInfo.color }}>{statusInfo.label}</span>
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Quick update */}
        <div className="bg-surface rounded-2xl p-4 border border-border">
          <h3 className="font-semibold text-text mb-3">อัปเดตสถานะด่วน</h3>

          {/* Fuel select */}
          <p className="text-sm text-sub mb-2">เลือกชนิดน้ำมัน</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {Object.entries(FUEL_TYPES).map(([key, info]) => (
              <button
                key={key}
                onClick={() => setSelectedFuel(key)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-colors
                  ${selectedFuel === key ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/30'}`}
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: info.color }} />
                {info.name}
              </button>
            ))}
          </div>

          {selectedFuel ? (
            <>
              {/* Status */}
              <p className="text-sm text-sub mb-2">สถานะ</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {(['available', 'queue', 'out'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`p-2 rounded-xl border text-xs font-medium
                      ${status === s ? 'border-2' : 'border-border'}`}
                    style={status === s ? { borderColor: STATUS_CONFIG[s].color, color: STATUS_CONFIG[s].color } : {}}
                  >
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>

              {status === 'queue' ? (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {(['none', 'low', 'medium', 'high'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setQueueLevel(q)}
                      className={`p-1.5 rounded-lg border text-xs ${queueLevel === q ? 'border-accent text-accent' : 'border-border'}`}
                    >
                      {QUEUE_CONFIG[q].label}
                    </button>
                  ))}
                </div>
              ) : null}

              {/* Price */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-muted">ราคา ฿</span>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-surface-hover rounded-lg px-3 py-2 text-sm outline-none"
                />
              </div>

              {/* Limit */}
              <div className="flex items-center gap-2 mb-4">
                <select
                  value={limitType}
                  onChange={(e) => setLimitType(e.target.value as 'liters' | 'baht' | '')}
                  className="bg-surface-hover rounded-lg px-3 py-2 text-sm outline-none"
                >
                  <option value="">ไม่จำกัด</option>
                  <option value="baht">จำกัด (บาท)</option>
                  <option value="liters">จำกัด (ลิตร)</option>
                </select>
                {limitType ? (
                  <input
                    type="number"
                    value={limitAmount}
                    onChange={(e) => setLimitAmount(e.target.value)}
                    placeholder="จำนวน"
                    className="flex-1 bg-surface-hover rounded-lg px-3 py-2 text-sm outline-none"
                  />
                ) : null}
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-accent text-white py-2.5 rounded-xl font-medium disabled:opacity-50"
              >
                {submitting ? 'กำลังอัปเดต...' : 'อัปเดตสถานะ'}
              </button>
            </>
          ) : null}
        </div>

        {/* Back to home */}
        <div className="text-center">
          <a href="/" className="text-sm text-muted hover:text-accent">กลับหน้าหลัก</a>
        </div>
      </div>
    </div>
  )
}

export default function StaffDashboardPage() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  )
}
