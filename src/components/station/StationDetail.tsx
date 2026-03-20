'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Station } from '@/lib/supabase/types'
import { FUEL_TYPES, STATUS_CONFIG, QUEUE_CONFIG, type FuelType } from '@/lib/constants'
import { formatDistance, formatTimeAgo, formatPrice, formatLimit } from '@/lib/utils'
import { getBrandInfo } from '@/lib/constants'
import { useBookmarks } from '@/hooks/useBookmarks'
import { useRealtimeStatus } from '@/hooks/useRealtimeStatus'
import { useStationDetail } from '@/hooks/useStationDetail'
import { Modal } from '@/components/ui/Modal'
import { OpenStatusBadge } from './OpenStatusBadge'
import { ThumbsUp, Bookmark, Navigation, AlertTriangle, BadgeCheck, Truck, Clock, MessageCircle, Send } from 'lucide-react'

function formatCommentTime(isoStr: string) {
  const d = new Date(isoStr)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diffMin < 1) return 'เมื่อสักครู่'
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} ชม.ที่แล้ว`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay} วันที่แล้ว`
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

interface StationDetailProps {
  stationId: number | null
  userLat?: number | null
  userLng?: number | null
  onClose: () => void
  onReport: (stationId: number) => void
}

export function StationDetail({ stationId, userLat, userLng, onClose, onReport }: StationDetailProps) {
  const { station, refresh } = useStationDetail(stationId, userLat, userLng)
  const { toggle, has } = useBookmarks()
  const [voting, setVoting] = useState<number | null>(null)
  const [comments, setComments] = useState<{ id: number; message: string; created_at: string }[]>([])
  const [commentText, setCommentText] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)

  const handleRefresh = useCallback(() => refresh(), [refresh])
  useRealtimeStatus(stationId, handleRefresh)

  const fetchComments = useCallback(async (sid: number) => {
    const res = await fetch(`/api/comments?station_id=${sid}`)
    if (res.ok) setComments(await res.json())
  }, [])

  useEffect(() => {
    if (stationId) {
      fetchComments(stationId)
      setCommentText('')
      setCommentError(null)
    } else {
      setComments([])
    }
  }, [stationId, fetchComments])

  const handleSendComment = async () => {
    if (!stationId || !commentText.trim()) return
    setSendingComment(true)
    setCommentError(null)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station_id: stationId, message: commentText.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setCommentError(data.error ?? 'ส่งข้อความไม่สำเร็จ')
        return
      }
      setCommentText('')
      fetchComments(stationId)
    } finally {
      setSendingComment(false)
    }
  }

  const handleVote = async (statusId: number) => {
    setVoting(statusId)
    try {
      await fetch('/api/reports/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_id: statusId }),
      })
      refresh()
    } finally {
      setVoting(null)
    }
  }

  if (!station) return null

  const brand = getBrandInfo(station.brand)
  const isBookmarked = has(station.id)

  return (
    <Modal open={stationId !== null} onClose={onClose} title={station.name}>
      {/* Info chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <OpenStatusBadge isOpen={station.is_open} />
        {station.distance_m !== null ? (
          <span className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full font-medium">
            {formatDistance(station.distance_m)}
          </span>
        ) : null}
        <span className="text-xs bg-surface-hover text-sub px-2.5 py-1 rounded-full flex items-center gap-1.5">
          {brand.logo ? (
            <img src={brand.logo} alt={station.brand} className="w-4 h-4 rounded-full object-contain bg-white" />
          ) : null}
          {station.brand}
        </span>
      </div>

      {station.address ? (
        <p className="text-xs text-muted mb-4">{station.address}</p>
      ) : null}

      {/* Reopen info */}
      {!station.is_open && station.reopen_info ? (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 mb-4 text-sm text-orange-400 flex items-center gap-2">
          <Clock size={16} className="shrink-0" />
          <span>
            เปิดอีกครั้ง:{' '}
            <span className="font-medium">
              {(() => {
                const d = new Date(station.reopen_info.reopen_date + 'T00:00:00')
                const today = new Date(); today.setHours(0,0,0,0)
                const tom = new Date(today); tom.setDate(tom.getDate()+1)
                const ds = d.getTime() === today.getTime() ? 'วันนี้' : d.getTime() === tom.getTime() ? 'พรุ่งนี้' : `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
                const ts = station.reopen_info!.reopen_time_slot === 'morning' ? ' ช่วงเช้า' : station.reopen_info!.reopen_time_slot === 'afternoon' ? ' ช่วงบ่าย' : station.reopen_info!.reopen_time_slot === 'exact' && station.reopen_info!.reopen_time ? ` ${station.reopen_info!.reopen_time} น.` : ''
                return ds + ts
              })()}
            </span>
          </span>
          {station.reopen_info.reported_by_role !== 'anonymous' ? (
            <span className="text-[10px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded-full">เจ้าของปั๊ม</span>
          ) : null}
        </div>
      ) : null}

      {/* Station-wide limits */}
      {station.station_limits.filter((l) => l.fuel_type === null).map((limit, i) => (
        <div key={i} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4 text-sm text-amber-400 flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span><span className="font-medium">จำกัดการเติม:</span> {formatLimit(limit.limit_type, limit.limit_amount)}</span>
        </div>
      ))}

      {/* Next delivery */}
      {station.next_delivery ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4 text-sm text-amber-400 flex items-center gap-2">
          <Truck size={16} className="shrink-0" />
          <span>
            รถน้ำมันเข้า:{' '}
            <span className="font-medium">
              {(() => {
                const d = new Date(station.next_delivery.delivery_date + 'T00:00:00')
                const today = new Date(); today.setHours(0,0,0,0)
                const tom = new Date(today); tom.setDate(tom.getDate()+1)
                const ds = d.getTime() === today.getTime() ? 'วันนี้' : d.getTime() === tom.getTime() ? 'พรุ่งนี้' : `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
                const ts = station.next_delivery.delivery_time_slot === 'morning' ? ' ช่วงเช้า' : station.next_delivery.delivery_time_slot === 'afternoon' ? ' ช่วงบ่าย' : station.next_delivery.delivery_time_slot === 'exact' && station.next_delivery.delivery_time ? ` ${station.next_delivery.delivery_time} น.` : ''
                return ds + ts
              })()}
            </span>
          </span>
          {station.next_delivery.reported_by_role !== 'anonymous' ? (
            <span className="text-[10px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded-full">เจ้าของปั๊ม</span>
          ) : null}
        </div>
      ) : null}

      {/* Fuel reports */}
      <div className="space-y-3 mb-4">
        <h4 className="text-sm font-semibold text-text">สถานะน้ำมัน</h4>
        {station.fuel_data.length > 0 ? (
          station.fuel_data.map((fuel) => {
            const fuelInfo = FUEL_TYPES[fuel.fuel_type as FuelType]
            const statusInfo = STATUS_CONFIG[fuel.status]
            const queueInfo = QUEUE_CONFIG[fuel.queue_level as keyof typeof QUEUE_CONFIG]

            return (
              <div key={fuel.fuel_type} className="bg-surface-hover rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: fuelInfo?.color ?? '#888' }}
                    />
                    <span className="text-sm font-medium text-text">{fuelInfo?.name ?? fuel.fuel_type}</span>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: statusInfo.color + '20',
                      color: statusInfo.color,
                    }}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted">
                  {fuel.price !== null ? (
                    <span className="font-semibold text-accent">{formatPrice(fuel.price)}</span>
                  ) : null}
                  {queueInfo && fuel.queue_level !== 'none' ? (
                    <span style={{ color: queueInfo.color }}>{queueInfo.label}</span>
                  ) : null}
                  {fuel.fill_limit_type ? (
                    <span className="text-amber-400">
                      {formatLimit(fuel.fill_limit_type, fuel.fill_limit_amount)}
                    </span>
                  ) : null}
                  {fuel.reported_by_role !== 'anonymous' ? (
                    <span className="flex items-center gap-1 bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded-full text-[10px]">
                      <BadgeCheck size={10} />
                      เจ้าของปั๊ม
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <span className="text-[10px] text-muted">{formatTimeAgo(fuel.reported_ago_min)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleVote(fuel.status_id) }}
                    disabled={voting === fuel.status_id}
                    className="flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors disabled:opacity-50"
                  >
                    <ThumbsUp size={14} />
                    {fuel.votes_confirm}
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <p className="text-sm text-muted py-4 text-center">ยังไม่มีรายงาน</p>
        )}
      </div>

      {/* Comments */}
      <div className="space-y-3 mb-4">
        <h4 className="text-sm font-semibold text-text flex items-center gap-1.5">
          <MessageCircle size={14} />
          ข้อความจากผู้ใช้
        </h4>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="แชร์ข้อมูลเกี่ยวกับปั๊มนี้..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSendComment() }}
            maxLength={300}
            className="flex-1 bg-surface-hover rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-muted"
          />
          <button
            onClick={handleSendComment}
            disabled={sendingComment || !commentText.trim()}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-accent text-white shrink-0 disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            <Send size={16} />
          </button>
        </div>
        {commentError ? (
          <p className="text-xs text-red-400">{commentError}</p>
        ) : null}

        {/* Messages */}
        {comments.length > 0 ? (
          <div className="space-y-2">
            {comments.map((c) => (
              <div key={c.id} className="bg-surface-hover rounded-xl px-3 py-2">
                <p className="text-sm text-text break-words">{c.message}</p>
                <span className="text-[10px] text-muted">
                  {formatCommentTime(c.created_at)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted text-center py-2">ยังไม่มีข้อความ</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onReport(station.id)}
          className="flex-1 bg-accent text-white py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
        >
          รายงานสถานะ
        </button>
        <button
          onClick={() => toggle(station.id)}
          className={`w-11 h-11 flex items-center justify-center rounded-xl border transition-colors
            ${isBookmarked ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' : 'border-border text-muted hover:text-amber-400'}`}
        >
          <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-11 h-11 flex items-center justify-center rounded-xl border border-border text-muted hover:text-accent transition-colors"
        >
          <Navigation size={18} />
        </a>
      </div>
    </Modal>
  )
}
