'use client'

import { useState } from 'react'
import { MapPin, X, ChevronRight, ChevronLeft, Loader2, CheckCircle2 } from 'lucide-react'

interface Props {
  onClose: () => void
}

type Step = 'location' | 'name' | 'done'

export function RequestStationWizard({ onClose }: Props) {
  const [step, setStep] = useState<Step>('location')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const getLocation = () => {
    setLocating(true)
    setLocError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setLocating(false)
      },
      () => {
        setLocError('ไม่สามารถดึงตำแหน่งได้ กรุณาเปิด GPS')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSubmit = async () => {
    if (!name.trim() || !lat || !lng) return
    setSubmitting(true)
    setSubmitError('')

    try {
      const res = await fetch('/api/station-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), lat, lng, note }),
      })

      if (!res.ok) {
        const data = await res.json()
        setSubmitError(data.error || 'เกิดข้อผิดพลาด')
        setSubmitting(false)
        return
      }

      setStep('done')
    } catch {
      setSubmitError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface rounded-2xl w-full max-w-sm p-5 space-y-4 animate-slide-up relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-text">
            {step === 'done' ? 'สำเร็จ!' : 'ขอเพิ่มปั๊มใหม่'}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        {/* Step: Location */}
        {step === 'location' && (
          <div className="space-y-4">
            <p className="text-sm text-sub">กดปุ่มด้านล่างเพื่อดึงตำแหน่งปัจจุบันของคุณ ระบบจะใช้ตำแหน่งนี้เป็นที่ตั้งปั๊ม</p>

            <button
              onClick={getLocation}
              disabled={locating}
              className="w-full flex items-center justify-center gap-2 bg-accent/15 text-accent py-3 rounded-xl font-medium text-sm disabled:opacity-50"
            >
              {locating ? (
                <><Loader2 size={18} className="animate-spin" /> กำลังค้นหาตำแหน่ง...</>
              ) : (
                <><MapPin size={18} /> ดึงตำแหน่งปัจจุบัน</>
              )}
            </button>

            {locError && <p className="text-xs text-red-400 text-center">{locError}</p>}

            {lat && lng && (
              <div className="bg-surface-hover rounded-xl p-3 text-center">
                <p className="text-xs text-muted">ตำแหน่งที่ได้</p>
                <p className="text-sm font-mono text-text">{lat.toFixed(6)}, {lng.toFixed(6)}</p>
              </div>
            )}

            <button
              onClick={() => setStep('name')}
              disabled={!lat || !lng}
              className="w-full bg-accent text-white py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-1 disabled:opacity-40"
            >
              ถัดไป <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Step: Name */}
        {step === 'name' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted mb-1 block">ชื่อปั๊มน้ำมัน *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น ปั๊ม PTT สาขาลาดพร้าว"
                className="w-full bg-surface-hover rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-muted"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs text-muted mb-1 block">หมายเหตุ (ไม่บังคับ)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น อยู่ตรงแยกไฟแดง"
                className="w-full bg-surface-hover rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-muted"
              />
            </div>

            {submitError && <p className="text-xs text-red-400 text-center">{submitError}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('location')}
                className="flex-1 bg-surface-hover text-sub py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-1"
              >
                <ChevronLeft size={16} /> ย้อนกลับ
              </button>
              <button
                onClick={handleSubmit}
                disabled={!name.trim() || submitting}
                className="flex-1 bg-accent text-white py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-1 disabled:opacity-40"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : 'บันทึก'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="space-y-4 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <p className="text-sm text-text font-medium">ขอบคุณที่ร่วมแบ่งปันกับเรา</p>
              <p className="text-xs text-muted mt-1">Admin จะทำการเพิ่มข้อมูลปั๊มให้เร็วๆ นี้</p>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-accent text-white py-3 rounded-xl font-medium text-sm"
            >
              ปิด
            </button>
          </div>
        )}

        {/* Step indicator */}
        {step !== 'done' && (
          <div className="flex justify-center gap-2 pt-1">
            <div className={`w-2 h-2 rounded-full ${step === 'location' ? 'bg-accent' : 'bg-muted/40'}`} />
            <div className={`w-2 h-2 rounded-full ${step === 'name' ? 'bg-accent' : 'bg-muted/40'}`} />
          </div>
        )}
      </div>
    </div>
  )
}
