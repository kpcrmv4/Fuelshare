import { memo } from 'react'
import { FUEL_TYPES, STATUS_CONFIG, type FuelType } from '@/lib/constants'
import type { FuelData } from '@/lib/supabase/types'

interface FuelBadgeProps {
  fuel: FuelData
}

export const FuelBadge = memo(function FuelBadge({ fuel }: FuelBadgeProps) {
  const fuelInfo = FUEL_TYPES[fuel.fuel_type as FuelType]
  const statusInfo = STATUS_CONFIG[fuel.status]
  const name = fuelInfo?.name ?? fuel.fuel_type

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
      style={{
        borderColor: statusInfo.color + '40',
        backgroundColor: statusInfo.color + '15',
        color: statusInfo.color,
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: statusInfo.color }}
      />
      {name}
    </span>
  )
})
