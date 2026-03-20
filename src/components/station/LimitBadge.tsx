import { memo } from 'react'
import { formatLimit } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

export const LimitBadge = memo(function LimitBadge({
  limitType,
  limitAmount,
}: {
  limitType: string | null
  limitAmount: number | null
}) {
  const text = formatLimit(limitType, limitAmount)
  if (!text) return null

  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
      <AlertTriangle size={12} />
      {text}
    </span>
  )
})
