'use client'

import { useState, useCallback } from 'react'

interface GeoLocation {
  lat: number
  lng: number
}

interface UseGeolocationReturn {
  location: GeoLocation | null
  loading: boolean
  error: string | null
  requestLocation: () => void
}

// Default: เชียงใหม่
const DEFAULT_LOCATION: GeoLocation = { lat: 18.7883, lng: 98.9853 }

export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('เบราว์เซอร์ไม่รองรับ GPS')
      setLocation(DEFAULT_LOCATION)
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      (err) => {
        const msg = err.code === 1
          ? 'กรุณาอนุญาตการเข้าถึงตำแหน่ง'
          : 'ไม่สามารถระบุตำแหน่งได้'
        setError(msg)
        setLocation(DEFAULT_LOCATION)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  return { location, loading, error, requestLocation }
}
