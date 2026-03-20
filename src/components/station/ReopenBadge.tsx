import { Clock } from 'lucide-react'
import type { ReopenInfo } from '@/lib/supabase/types'


interface ReopenBadgeProps {
  reopen: ReopenInfo
}

function formatReopenDate(dateStr: string) {
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

export function ReopenBadge({ reopen }: ReopenBadgeProps) {
  const dateText = formatReopenDate(reopen.reopen_date)
  const timeText = formatTimeSlot(reopen.reopen_time_slot, reopen.reopen_time)

  return (
    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
      <Clock size={14} className="text-orange-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-xs text-orange-400">
          เปิดอีกครั้ง <span className="font-medium">{dateText}</span>
          {timeText ? <> <span className="font-medium">{timeText}</span></> : null}
        </span>
        {reopen.note ? (
          <p className="text-[10px] text-muted truncate mt-0.5">{reopen.note}</p>
        ) : null}
      </div>
      {reopen.reported_by_role !== 'anonymous' ? (
        <span className="text-[10px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded-full shrink-0">
          เจ้าของปั๊ม
        </span>
      ) : null}
    </div>
  )
}
