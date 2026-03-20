'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { FUEL_TYPES, STATUS_CONFIG, QUEUE_CONFIG, type FuelType } from '@/lib/constants'
import { CheckCircle, AlertCircle, XCircle, ChevronDown, Trash2, Truck, Clock } from 'lucide-react'

type ReportStep = 'edit' | 'confirm'

interface ReportModalProps {
  stationId: number | null
  stationName: string
  onClose: () => void
  onDone: () => void
}

type TimeSlot = 'morning' | 'afternoon' | 'exact' | 'unknown'

interface ScheduleInfo {
  date: string
  timeSlot: TimeSlot
  time: string
}

type DeliveryInfo = ScheduleInfo

interface ReopenData extends ScheduleInfo {
  note: string
}

interface FuelReport {
  fuel_type: string
  status: 'available' | 'queue' | 'out'
  queue_level: 'none' | 'low' | 'medium' | 'high'
  price: string
  limit_type: 'liters' | 'baht' | ''
  limit_amount: string
}

const defaultReport = (fuel_type: string): FuelReport => ({
  fuel_type,
  status: 'available',
  queue_level: 'none',
  price: '',
  limit_type: '',
  limit_amount: '',
})

const TIME_SLOTS: { key: TimeSlot; label: string }[] = [
  { key: 'morning', label: 'ช่วงเช้า' },
  { key: 'afternoon', label: 'ช่วงบ่าย' },
  { key: 'exact', label: 'ระบุเวลา' },
  { key: 'unknown', label: 'ไม่ทราบเวลา' },
]

function getBangkokDate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
}

function getTodayStr() {
  const d = getBangkokDate()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

function isoToDisplay(iso: string) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function displayToIso(display: string) {
  const [d, m, y] = display.split('/')
  if (!d || !m || !y || y.length !== 4) return null
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function formatDeliveryDisplay(d: DeliveryInfo) {
  const dateObj = new Date(d.date + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  let dateStr: string
  if (dateObj.getTime() === today.getTime()) dateStr = 'วันนี้'
  else if (dateObj.getTime() === tomorrow.getTime()) dateStr = 'พรุ่งนี้'
  else dateStr = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`

  const timeStr =
    d.timeSlot === 'morning' ? 'ช่วงเช้า' :
    d.timeSlot === 'afternoon' ? 'ช่วงบ่าย' :
    d.timeSlot === 'exact' && d.time ? `เวลา ${d.time} น.` :
    ''

  return timeStr ? `${dateStr} ${timeStr}` : dateStr
}

const STATUS_ICONS = {
  available: CheckCircle,
  queue: AlertCircle,
  out: XCircle,
} as const

export function ReportModal({ stationId, stationName, onClose, onDone }: ReportModalProps) {
  const { show: toast } = useToast()
  const [step, setStep] = useState<ReportStep>('edit')
  const [expandedFuel, setExpandedFuel] = useState<string | null>(null)
  const [reports, setReports] = useState<Map<string, FuelReport>>(new Map())
  const [delivery, setDelivery] = useState<DeliveryInfo | null>(null)
  const [reopen, setReopen] = useState<ReopenData | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const hasOutStatus = Array.from(reports.values()).some((r) => r.status === 'out')

  const toggleFuel = (ft: string) => {
    if (expandedFuel === ft) {
      setExpandedFuel(null)
      return
    }
    if (!reports.has(ft)) {
      setReports((prev) => {
        const next = new Map(prev)
        next.set(ft, defaultReport(ft))
        return next
      })
    }
    setExpandedFuel(ft)
  }

  const removeFuel = (ft: string) => {
    setReports((prev) => {
      const next = new Map(prev)
      next.delete(ft)
      return next
    })
    if (expandedFuel === ft) setExpandedFuel(null)
  }

  const updateReport = (key: string, update: Partial<FuelReport>) => {
    setReports((prev) => {
      const next = new Map(prev)
      const existing = next.get(key)
      if (existing) next.set(key, { ...existing, ...update })
      return next
    })
  }

  const submitAll = async () => {
    if (!stationId) return
    setSubmitting(true)

    try {
      const promises: Promise<Response>[] = []

      for (const [, report] of reports) {
        promises.push(
          fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              station_id: stationId,
              fuel_type: report.fuel_type,
              status: report.status,
              queue_level: report.queue_level,
            }),
          })
        )

        if (report.price) {
          promises.push(
            fetch('/api/prices', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                station_id: stationId,
                fuel_type: report.fuel_type,
                price: parseFloat(report.price),
              }),
            })
          )
        }

        if (report.limit_type && report.limit_amount) {
          promises.push(
            fetch('/api/limits', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                station_id: stationId,
                fuel_type: report.fuel_type,
                limit_type: report.limit_type,
                limit_amount: parseInt(report.limit_amount),
              }),
            })
          )
        }
      }

      if (delivery) {
        promises.push(
          fetch('/api/delivery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              station_id: stationId,
              fuel_type: null,
              delivery_date: delivery.date,
              delivery_time_slot: delivery.timeSlot,
              delivery_time: delivery.timeSlot === 'exact' && delivery.time ? delivery.time : null,
            }),
          })
        )
      }

      if (reopen) {
        promises.push(
          fetch('/api/reopen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              station_id: stationId,
              reopen_date: reopen.date,
              reopen_time_slot: reopen.timeSlot,
              reopen_time: reopen.timeSlot === 'exact' && reopen.time ? reopen.time : null,
              note: reopen.note || null,
            }),
          })
        )
      }

      await Promise.all(promises)
      toast('รายงานสำเร็จ!', 'success')
      onDone()
      onClose()
    } catch {
      toast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedCount = reports.size

  return (
    <Modal open={stationId !== null} onClose={onClose} title={`รายงาน - ${stationName}`}>
      {/* Step 1: Accordion list */}
      {step === 'edit' ? (
        <div>
          <p className="text-sm text-sub mb-3">แตะชนิดน้ำมันเพื่อกรอกข้อมูล</p>

          <div className="space-y-2 mb-4">
            {Object.entries(FUEL_TYPES).map(([key, info]) => {
              const isExpanded = expandedFuel === key
              const hasData = reports.has(key)
              const report = reports.get(key)

              return (
                <div
                  key={key}
                  className={`rounded-xl border transition-colors ${
                    hasData ? 'border-accent/50 bg-accent/5' : 'border-border'
                  }`}
                >
                  {/* Header row */}
                  <button
                    onClick={() => toggleFuel(key)}
                    className="w-full flex items-center gap-3 p-3 text-left"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: info.color }}
                    />
                    <span className="text-sm font-medium text-text flex-1">{info.name}</span>

                    {/* Summary badges when collapsed but has data */}
                    {hasData && !isExpanded && report ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: STATUS_CONFIG[report.status].color + '20',
                            color: STATUS_CONFIG[report.status].color,
                          }}
                        >
                          {STATUS_CONFIG[report.status].label}
                        </span>
                        {report.price ? (
                          <span className="text-[10px] text-accent font-medium">฿{report.price}</span>
                        ) : null}
                      </div>
                    ) : null}

                    <ChevronDown
                      size={16}
                      className={`text-muted shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Expanded form */}
                  {isExpanded && report ? (
                    <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-3">
                      {/* Status */}
                      <div>
                        <p className="text-xs text-muted mb-1.5">สถานะ</p>
                        <div className="grid grid-cols-3 gap-2">
                          {(['available', 'queue', 'out'] as const).map((s) => {
                            const sInfo = STATUS_CONFIG[s]
                            const selected = report.status === s
                            const Icon = STATUS_ICONS[s]
                            return (
                              <button
                                key={s}
                                onClick={() => updateReport(key, {
                                  status: s,
                                  queue_level: s === 'queue' ? report.queue_level : 'none',
                                })}
                                className={`py-2.5 rounded-lg border text-center transition-all ${
                                  selected ? 'border-2 scale-[1.02]' : 'border-border'
                                }`}
                                style={selected ? {
                                  borderColor: sInfo.color,
                                  backgroundColor: sInfo.color + '15',
                                } : {}}
                              >
                                <Icon
                                  size={22}
                                  className="mx-auto mb-1"
                                  style={{ color: selected ? sInfo.color : 'var(--muted)' }}
                                />
                                <span
                                  className="text-[11px] font-medium"
                                  style={{ color: selected ? sInfo.color : 'var(--sub)' }}
                                >
                                  {sInfo.label}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Queue level */}
                      {report.status === 'queue' ? (
                        <div>
                          <p className="text-xs text-muted mb-1.5">ระดับคิว</p>
                          <div className="grid grid-cols-4 gap-1.5">
                            {(['none', 'low', 'medium', 'high'] as const).map((q) => {
                              const qInfo = QUEUE_CONFIG[q]
                              const selected = report.queue_level === q
                              return (
                                <button
                                  key={q}
                                  onClick={() => updateReport(key, { queue_level: q })}
                                  className={`py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                                    selected ? 'border-2' : 'border-border'
                                  }`}
                                  style={selected ? {
                                    borderColor: qInfo.color,
                                    color: qInfo.color,
                                    backgroundColor: qInfo.color + '15',
                                  } : { color: 'var(--sub)' }}
                                >
                                  {qInfo.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ) : null}

                      {/* Price + Limit in one row */}
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-muted mb-1.5">ราคา</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted">฿</span>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={report.price}
                              onChange={(e) => updateReport(key, { price: e.target.value })}
                              className="w-full bg-surface-hover text-text rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-muted"
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted mb-1.5">จำกัดเติม</p>
                          <div className="flex gap-1.5">
                            <select
                              value={report.limit_type}
                              onChange={(e) => updateReport(key, { limit_type: e.target.value as 'liters' | 'baht' | '' })}
                              className="bg-surface-hover text-text rounded-lg px-2 py-1.5 text-xs outline-none"
                            >
                              <option value="">ไม่จำกัด</option>
                              <option value="baht">บาท</option>
                              <option value="liters">ลิตร</option>
                            </select>
                            {report.limit_type ? (
                              <input
                                type="number"
                                placeholder="จำนวน"
                                value={report.limit_amount}
                                onChange={(e) => updateReport(key, { limit_amount: e.target.value })}
                                className="w-full bg-surface-hover text-text rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-muted"
                              />
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => removeFuel(key)}
                        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={12} />
                        ลบรายการนี้
                      </button>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>

          {/* Next delivery section - shown when any fuel is "out" */}
          {hasOutStatus ? (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Truck size={16} className="text-amber-400" />
                <span className="text-sm font-medium text-text">รถน้ำมันจะเข้าเมื่อไหร่?</span>
                <span className="text-[10px] text-muted">(ไม่บังคับ)</span>
              </div>

              {!delivery ? (
                <button
                  type="button"
                  onClick={() => setDelivery({ date: getTodayStr(), timeSlot: 'unknown', time: '' })}
                  className="w-full py-2 rounded-lg border border-dashed border-amber-500/30 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
                >
                  + ระบุวันเข้าน้ำมัน
                </button>
              ) : (
                <div className="space-y-2.5">
                  {/* Date picker - shows DD/MM/YYYY */}
                  <div>
                    <p className="text-xs text-muted mb-1">วันที่ (DD/MM/YYYY)</p>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={isoToDisplay(delivery.date)}
                        className="w-full bg-surface-hover text-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer"
                        onClick={(e) => {
                          const hidden = (e.target as HTMLElement).nextElementSibling as HTMLInputElement
                          hidden?.showPicker?.()
                        }}
                      />
                      <input
                        type="date"
                        value={delivery.date}
                        min={getTodayStr()}
                        onChange={(e) => setDelivery({ ...delivery, date: e.target.value })}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Time slot */}
                  <div>
                    <p className="text-xs text-muted mb-1">ช่วงเวลา</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot.key}
                          type="button"
                          onClick={() => setDelivery({ ...delivery, timeSlot: slot.key, time: '' })}
                          className={`py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                            delivery.timeSlot === slot.key
                              ? 'border-amber-500 bg-amber-500/15 text-amber-400'
                              : 'border-border text-sub hover:border-amber-500/30'
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Exact time input */}
                  {delivery.timeSlot === 'exact' ? (
                    <div>
                      <p className="text-xs text-muted mb-1">เวลา (UTC+7)</p>
                      <input
                        type="time"
                        value={delivery.time}
                        onChange={(e) => setDelivery({ ...delivery, time: e.target.value })}
                        className="w-full bg-surface-hover text-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </div>
                  ) : null}

                  {/* Remove delivery */}
                  <button
                    type="button"
                    onClick={() => setDelivery(null)}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={12} />
                    ไม่ระบุวันเข้าน้ำมัน
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* Station closed / reopen section */}
          <div className="mb-4 rounded-xl border border-orange-500/30 bg-orange-500/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-orange-400" />
              <span className="text-sm font-medium text-text">ปั๊มปิดชั่วคราว?</span>
              <span className="text-[10px] text-muted">(ไม่บังคับ)</span>
            </div>

            {!reopen ? (
              <button
                type="button"
                onClick={() => setReopen({ date: getTodayStr(), timeSlot: 'unknown', time: '', note: '' })}
                className="w-full py-2 rounded-lg border border-dashed border-orange-500/30 text-sm text-orange-400 hover:bg-orange-500/10 transition-colors"
              >
                + ระบุวันที่จะเปิดอีกครั้ง
              </button>
            ) : (
              <div className="space-y-2.5">
                {/* Reopen date */}
                <div>
                  <p className="text-xs text-muted mb-1">วันที่เปิด (DD/MM/YYYY)</p>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={isoToDisplay(reopen.date)}
                      className="w-full bg-surface-hover text-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer"
                      onClick={(e) => {
                        const hidden = (e.target as HTMLElement).nextElementSibling as HTMLInputElement
                        hidden?.showPicker?.()
                      }}
                    />
                    <input
                      type="date"
                      value={reopen.date}
                      min={getTodayStr()}
                      onChange={(e) => setReopen({ ...reopen, date: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Reopen time slot */}
                <div>
                  <p className="text-xs text-muted mb-1">ช่วงเวลา</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot.key}
                        type="button"
                        onClick={() => setReopen({ ...reopen, timeSlot: slot.key, time: '' })}
                        className={`py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          reopen.timeSlot === slot.key
                            ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                            : 'border-border text-sub hover:border-orange-500/30'
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exact time */}
                {reopen.timeSlot === 'exact' ? (
                  <div>
                    <p className="text-xs text-muted mb-1">เวลา (UTC+7)</p>
                    <input
                      type="time"
                      value={reopen.time}
                      onChange={(e) => setReopen({ ...reopen, time: e.target.value })}
                      className="w-full bg-surface-hover text-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </div>
                ) : null}

                {/* Note */}
                <div>
                  <p className="text-xs text-muted mb-1">หมายเหตุ</p>
                  <input
                    type="text"
                    value={reopen.note}
                    onChange={(e) => setReopen({ ...reopen, note: e.target.value })}
                    placeholder="เช่น ปิดปรับปรุง, ปิดวันหยุด..."
                    maxLength={200}
                    className="w-full bg-surface-hover text-text rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-muted"
                  />
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => setReopen(null)}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 size={12} />
                  ไม่ระบุ
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setStep('confirm')}
            disabled={selectedCount === 0}
            className="w-full bg-accent text-white py-2.5 rounded-xl font-medium disabled:opacity-40 transition-opacity"
          >
            ถัดไป ({selectedCount} ชนิด)
          </button>
        </div>
      ) : null}

      {/* Step 2: Confirm */}
      {step === 'confirm' ? (
        <div>
          <p className="text-sm text-sub mb-3">ตรวจสอบข้อมูลก่อนส่ง</p>
          <div className="space-y-2 mb-4">
            {Array.from(reports.values()).map((r) => {
              const info = FUEL_TYPES[r.fuel_type as FuelType]
              const status = STATUS_CONFIG[r.status]
              const Icon = STATUS_ICONS[r.status]
              return (
                <div key={r.fuel_type} className="bg-surface-hover rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: info?.color }} />
                    <span className="text-sm font-medium text-text">{info?.name ?? r.fuel_type}</span>
                    <span
                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ml-auto font-medium"
                      style={{ backgroundColor: status.color + '20', color: status.color }}
                    >
                      <Icon size={12} />
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted pl-5">
                    {r.status === 'queue' ? (
                      <span style={{ color: QUEUE_CONFIG[r.queue_level].color }}>
                        {QUEUE_CONFIG[r.queue_level].label}
                      </span>
                    ) : null}
                    {r.price ? <span className="text-accent font-medium">฿{r.price}</span> : null}
                    {r.limit_type && r.limit_amount ? (
                      <span>จำกัด {r.limit_amount} {r.limit_type === 'liters' ? 'ลิตร' : 'บาท'}</span>
                    ) : null}
                    {!r.price && !(r.limit_type && r.limit_amount) && r.status !== 'queue' ? (
                      <span>สถานะเท่านั้น</span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
          {delivery ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4 flex items-center gap-2">
              <Truck size={16} className="text-amber-400 shrink-0" />
              <span className="text-sm text-amber-400">
                รถน้ำมันเข้า: <span className="font-medium">{formatDeliveryDisplay(delivery)}</span>
              </span>
            </div>
          ) : null}

          {reopen ? (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-orange-400 shrink-0" />
                <span className="text-sm text-orange-400">
                  เปิดอีกครั้ง: <span className="font-medium">{formatDeliveryDisplay(reopen)}</span>
                </span>
              </div>
              {reopen.note ? (
                <p className="text-xs text-muted mt-1 pl-6">{reopen.note}</p>
              ) : null}
            </div>
          ) : null}

          <div className="flex gap-2">
            <button
              onClick={() => setStep('edit')}
              className="flex-1 border border-border py-2.5 rounded-xl text-sm font-medium text-sub hover:bg-surface-hover transition-colors"
            >
              แก้ไข
            </button>
            <button
              onClick={submitAll}
              disabled={submitting}
              className="flex-1 bg-accent text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'กำลังส่ง...' : 'ส่งรายงาน'}
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
