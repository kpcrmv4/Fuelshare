'use client'

import { useState, useCallback } from 'react'
import { RADAR_DEFAULT_KM, RADAR_MIN_KM, RADAR_MAX_KM } from '@/lib/constants'

export function useRadar() {
  const [radiusKm, setRadiusKm] = useState(RADAR_DEFAULT_KM)

  const setRadius = useCallback((km: number) => {
    setRadiusKm(Math.min(Math.max(km, RADAR_MIN_KM), RADAR_MAX_KM))
  }, [])

  return {
    radiusKm,
    radiusM: radiusKm * 1000,
    setRadius,
  }
}
