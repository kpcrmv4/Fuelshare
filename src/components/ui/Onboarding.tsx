'use client'

import { useState, useEffect } from 'react'
import { Crosshair, MessageSquareWarning, X, ChevronRight } from 'lucide-react'

const STORAGE_KEY = 'fuel_onboarded'

export function Onboarding() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setShow(true)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setShow(false)
  }

  if (!show) return null

  const steps = [
    {
      icon: <Crosshair size={32} />,
      title: 'อัพเดทตำแหน่งของคุณ',
      description: 'กดปุ่มเป้าเล็ง ที่มุมขวาล่างของแผนที่ เพื่ออัพเดทตำแหน่งปัจจุบันของคุณ แล้วระบบจะค้นหาปั๊มน้ำมันใกล้เคียงให้อัตโนมัติ',
    },
    {
      icon: <MessageSquareWarning size={32} />,
      title: 'ช่วยกันอัพเดทข้อมูล',
      description: 'ข้อมูลสถานะน้ำมันอาจคลาดเคลื่อน โปรดตรวจสอบและอัพเดทข้อมูลให้คนอื่นทราบด้วย โดยกดปุ่ม + เพื่อรายงานสถานะปั๊ม',
    },
  ]

  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={dismiss}>
      <div
        className="bg-surface rounded-2xl w-full max-w-sm p-6 space-y-5 animate-slide-up relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={dismiss} className="absolute top-4 right-4 text-muted hover:text-text">
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          <div className="w-16 h-16 rounded-full bg-accent/15 text-accent flex items-center justify-center">
            {current.icon}
          </div>
          <h3 className="text-lg font-bold text-text">{current.title}</h3>
          <p className="text-sm text-sub leading-relaxed">{current.description}</p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-accent' : 'bg-muted/40'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {isLast ? (
            <button
              onClick={dismiss}
              className="w-full bg-accent text-white py-3 rounded-xl font-medium text-sm"
            >
              เข้าใจแล้ว เริ่มใช้งาน
            </button>
          ) : (
            <>
              <button
                onClick={dismiss}
                className="flex-1 bg-surface-hover text-sub py-3 rounded-xl font-medium text-sm"
              >
                ข้าม
              </button>
              <button
                onClick={() => setStep(step + 1)}
                className="flex-1 bg-accent text-white py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-1"
              >
                ถัดไป <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
