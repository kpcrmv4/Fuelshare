import { memo } from 'react'
import { QUEUE_CONFIG } from '@/lib/constants'

export const QueueBadge = memo(function QueueBadge({ level }: { level: string }) {
  if (level === 'none') return null
  const info = QUEUE_CONFIG[level as keyof typeof QUEUE_CONFIG]
  if (!info) return null

  return (
    <span className="text-xs font-medium" style={{ color: info.color }}>
      {info.label}
    </span>
  )
})
