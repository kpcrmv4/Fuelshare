'use client'

import useSWR from 'swr'
import type { Station } from '@/lib/supabase/types'

const fetcher = async (url: string) => {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`API error ${r.status}`)
  const json = await r.json()
  return Array.isArray(json) ? json : []
}

export function useNearbyStations(
  lat: number | null,
  lng: number | null,
  radiusM: number
) {
  const key = lat !== null && lng !== null
    ? `/api/stations/nearby?lat=${lat}&lng=${lng}&r=${radiusM}`
    : null

  const { data, error, isLoading, mutate } = useSWR<Station[]>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  })

  return {
    stations: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
}
