import { Truck } from 'lucide-react'
import type { NextDelivery } from '@/lib/supabase/types'

interface DeliveryBadgeProps {
  delivery: NextDelivery
}

function formatDeliveryDate(dateStr: string) {
  const dateObj = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (dateObj.getTime() === today.getTime()) return 'วันนี้'
  if (dateObj.getTime() === tomorrow.getTime()) return 'พรุ่งนี้'
  return `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`
}

function formatTimeSlot(slot: string, time: string | null) {
  if (slot === 'morning') return 'ช่วงเช้า'
  if (slot === 'afternoon') return 'ช่วงบ่าย'
  if (slot === 'exact' && time) return `${time} น.`
  return ''
}

export function DeliveryBadge({ delivery }: DeliveryBadgeProps) {
  const dateText = formatDeliveryDate(delivery.delivery_date)
  const timeText = formatTimeSlot(delivery.delivery_time_slot, delivery.delivery_time)

  return (
    <div className="flex items-center gap-1.5 text-amber-400">
      <Truck size={13} className="shrink-0" />
      <span className="text-xs">
        น้ำมันเข้า <span className="font-medium">{dateText}</span>
        {timeText ? <> <span className="font-medium">{timeText}</span></> : null}
      </span>
      {delivery.reported_by_role !== 'anonymous' ? (
        <span className="text-[10px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded-full ml-1">
          เจ้าของปั๊ม
        </span>
      ) : null}
    </div>
  )
}
