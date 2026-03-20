'use client'

import { memo } from 'react'
import type { Station } from '@/lib/supabase/types'
import { getBrandInfo, FUEL_TYPES, type FuelType } from '@/lib/constants'
import { formatDistance, formatTimeAgo } from '@/lib/utils'
import { FuelBadge } from './FuelBadge'
import { PriceBadge } from './PriceBadge'
import { QueueBadge } from './QueueBadge'
import { LimitBadge } from './LimitBadge'
import { OpenStatusBadge } from './OpenStatusBadge'
import { DeliveryBadge } from './DeliveryBadge'
import { ReopenBadge } from './ReopenBadge'

interface StationCardProps {
  station: Station
  onClick: (station: Station) => void
}

export const StationCard = memo(function StationCard({ station, onClick }: StationCardProps) {
  const brand = getBrandInfo(station.brand)
  const hasFuelData = station.fuel_data.length > 0
  const stationLimits = station.station_limits.filter((l) => l.fuel_type === null)

  return (
    <button
      onClick={() => onClick(station)}
      className="w-full text-left bg-surface rounded-2xl p-4 border border-border hover:border-accent/30 hover:shadow-md transition-all"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {brand.logo ? (
          <img
            src={brand.logo}
            alt={station.brand}
            className="w-10 h-10 rounded-full object-contain bg-white shrink-0"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ backgroundColor: brand.color, color: brand.textColor }}
          >
            {station.brand.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text truncate">{station.name}</h3>
            <OpenStatusBadge isOpen={station.is_open} />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>{station.brand}</span>
            {station.distance_m !== null ? (
              <>
                <span>·</span>
                <span className="font-medium text-accent">{formatDistance(station.distance_m)}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Reopen info when closed */}
      {!station.is_open && station.reopen_info ? (
        <div className="mb-3">
          <ReopenBadge reopen={station.reopen_info} />
        </div>
      ) : null}

      {/* Fuel data */}
      {hasFuelData ? (
        <div className="space-y-2">
          {station.fuel_data.map((fuel) => {
            const fuelInfo = FUEL_TYPES[fuel.fuel_type as FuelType]
            return (
              <div key={fuel.fuel_type} className="flex items-center gap-2 flex-wrap">
                <FuelBadge fuel={fuel} />
                <PriceBadge price={fuel.price} />
                <QueueBadge level={fuel.queue_level} />
                <LimitBadge limitType={fuel.fill_limit_type} limitAmount={fuel.fill_limit_amount} />
                {fuel.reported_by_role !== 'anonymous' ? (
                  <span className="text-[10px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded-full">
                    เจ้าของปั๊ม
                  </span>
                ) : null}
                <span className="text-[10px] text-muted ml-auto">
                  {formatTimeAgo(fuel.reported_ago_min)}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-muted">ยังไม่มีรายงาน</p>
      )}

      {/* Next delivery */}
      {station.next_delivery ? (
        <div className="mt-2 pt-2 border-t border-border">
          <DeliveryBadge delivery={station.next_delivery} />
        </div>
      ) : null}

      {/* Station-wide limits */}
      {stationLimits.length > 0 ? (
        <div className="mt-2 pt-2 border-t border-border">
          {stationLimits.map((limit, i) => (
            <LimitBadge key={i} limitType={limit.limit_type} limitAmount={limit.limit_amount} />
          ))}
        </div>
      ) : null}
    </button>
  )
})
