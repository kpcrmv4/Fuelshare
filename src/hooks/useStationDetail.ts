'use client'

import useSWR from 'swr'
import type { Station } from '@/lib/supabase/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useStationDetail(
  stationId: number | null,
  lat?: number | null,
  lng?: number | null
) {
  const params = new URLSearchParams()
  if (lat != null && lng != null) {
    params.set('lat', String(lat))
    params.set('lng', String(lng))
  }

  const key = stationId
    ? `/api/stations/${stationId}?${params.toString()}`
    : null

  const { data, error, isLoading, mutate } = useSWR<Station>(key, fetcher, {
    revalidateOnFocus: false,
  })

  return { station: data ?? null, isLoading, error, refresh: mutate }
}
