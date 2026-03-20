'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeStatus(
  stationId: number | null,
  onUpdate: () => void
) {
  useEffect(() => {
    if (!stationId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`station-${stationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fuel_status',
          filter: `station_id=eq.${stationId}`,
        },
        () => onUpdate()
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fuel_prices',
          filter: `station_id=eq.${stationId}`,
        },
        () => onUpdate()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [stationId, onUpdate])
}
