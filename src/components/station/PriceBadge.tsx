import { memo } from 'react'
import { formatPrice } from '@/lib/utils'

export const PriceBadge = memo(function PriceBadge({ price }: { price: number | null }) {
  if (price === null) return null

  return (
    <span className="text-xs font-semibold text-accent">
      {formatPrice(price)}
    </span>
  )
})
