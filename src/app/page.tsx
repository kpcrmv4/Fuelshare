'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useRadar } from '@/hooks/useRadar'
import { useNearbyStations } from '@/hooks/useNearbyStations'
import { RadarSlider } from '@/components/map/RadarSlider'
import { StationCard } from '@/components/station/StationCard'
import { StationDetail } from '@/components/station/StationDetail'
import { FilterChips } from '@/components/ui/FilterChips'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ToastProvider } from '@/components/ui/Toast'
import { MapSkeleton, StationListSkeleton } from '@/components/ui/Skeleton'
import { FUEL_TYPES, type FuelCategory, type FuelType, isMajorBrand } from '@/lib/constants'
import type { Station } from '@/lib/supabase/types'
import { RefreshCw, Crosshair, Plus, Fuel, UserCircle, Bookmark, Shield } from 'lucide-react'
import { useBookmarks } from '@/hooks/useBookmarks'
import Link from 'next/link'
import { InstallButton } from '@/components/ui/InstallButton'

const RadarMap = dynamic(
  () => import('@/components/map/RadarMap').then((m) => ({ default: m.RadarMap })),
  { ssr: false, loading: () => <MapSkeleton /> }
)

const ReportModal = dynamic(
  () => import('@/components/report/ReportModal').then((m) => ({ default: m.ReportModal })),
)

export default function HomePage() {
  const { location, loading: geoLoading, requestLocation } = useGeolocation()
  const { radiusKm, radiusM, setRadius } = useRadar()
  const { stations, isLoading, refresh } = useNearbyStations(
    location?.lat ?? null,
    location?.lng ?? null,
    radiusM
  )

  const { bookmarks, has: isBookmarked, count: bookmarkCount } = useBookmarks()
  const [filter, setFilter] = useState<FuelCategory>('all')
  const [search, setSearch] = useState('')
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [majorOnly, setMajorOnly] = useState(false)
  const [selectedStation, setSelectedStation] = useState<number | null>(null)
  const [reportStation, setReportStation] = useState<{ id: number; name: string } | null>(null)

  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  const filteredStations = useMemo(() => {
    let result = Array.isArray(stations) ? stations : []

    if (showBookmarks) {
      result = result.filter((s) => bookmarks.includes(s.id))
    }

    if (majorOnly) {
      result = result.filter((s) => isMajorBrand(s.brand))
    }

    if (filter !== 'all') {
      result = result.filter((s) =>
        s.fuel_data.some((f) => {
          const info = FUEL_TYPES[f.fuel_type as FuelType]
          return info?.category === filter
        })
      )
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.brand.toLowerCase().includes(q)
      )
    }

    return result
  }, [stations, filter, search, showBookmarks, bookmarks, majorOnly])

  const handleStationClick = useCallback((station: Station) => {
    setSelectedStation(station.id)
  }, [])

  const handleReport = useCallback((stationId: number) => {
    const station = stations.find((s) => s.id === stationId)
    if (station) {
      setSelectedStation(null)
      setReportStation({ id: station.id, name: station.name })
    }
  }, [stations])

  return (
    <ToastProvider>
      <div className="flex flex-col h-dvh">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <img src="/icon-192.png" alt="logo" className="w-9 h-9 rounded-xl" />
            <div>
              <h1 className="text-base font-bold text-text">ปั๊มไหนมีน้ำมัน?</h1>
              <p className="text-xs text-muted">เช็คสถานะ ราคา คิว แบบ Realtime</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <InstallButton />
            <Link
              href="/staff/login"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-hover transition-colors text-muted"
              title="เข้าสู่ระบบพนักงาน"
            >
              <UserCircle size={18} />
            </Link>
            <button
              onClick={() => refresh()}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-hover transition-colors text-muted"
              title="รีเฟรช"
            >
              <RefreshCw size={16} />
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Map */}
        <div className="relative">
          {location ? (
            <RadarMap
              center={location}
              radiusM={radiusM}
              stations={filteredStations}
              onStationClick={handleStationClick}
            />
          ) : (
            <MapSkeleton />
          )}

          {/* Locate me button */}
          <button
            onClick={requestLocation}
            disabled={geoLoading}
            className="absolute bottom-4 right-4 z-[5] w-10 h-10 bg-surface rounded-full shadow-lg flex items-center justify-center text-accent hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            <Crosshair size={18} />
          </button>
        </div>

        {/* Radar slider */}
        <RadarSlider radiusKm={radiusKm} onChange={setRadius} />

        {/* Filter + Search */}
        <FilterChips selected={filter} onChange={setFilter} />
        <div className="px-4 pb-2 flex gap-2">
          <input
            type="text"
            placeholder="ค้นหาชื่อปั๊ม..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-surface-hover rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-muted"
          />
          <button
            onClick={() => setMajorOnly((v) => !v)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl shrink-0 transition-colors ${
              majorOnly
                ? 'bg-accent/15 text-accent border border-accent/40'
                : 'bg-surface-hover text-muted hover:text-text'
            }`}
            title="เฉพาะปั๊มหลัก"
          >
            <Shield size={18} fill={majorOnly ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => setShowBookmarks((v) => !v)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl shrink-0 transition-colors ${
              showBookmarks
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
                : 'bg-surface-hover text-muted hover:text-text'
            }`}
            title="ปั๊มที่บันทึกไว้"
          >
            <Bookmark size={18} fill={showBookmarks ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Station list */}
        <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-3">
          {isLoading ? (
            <StationListSkeleton />
          ) : filteredStations.length > 0 ? (
            <>
              <p className="text-xs text-muted">พบ {filteredStations.length} ปั๊ม ในรัศมี {radiusKm} กม.</p>
              {filteredStations.map((station) => (
                <StationCard key={station.id} station={station} onClick={handleStationClick} />
              ))}
            </>
          ) : (
            <div className="text-center py-12">
              <Fuel size={40} className="mx-auto mb-3 text-muted" />
              <p className="text-sm text-muted">ไม่พบปั๊มน้ำมันในรัศมี {radiusKm} กม.</p>
              <p className="text-xs text-muted mt-1">ลองขยายรัศมีหรือเลื่อนไปยังพื้นที่อื่น</p>
            </div>
          )}
        </div>

        {/* FAB - Report */}
        <button
          onClick={() => {
            if (filteredStations.length > 0) {
              setReportStation({ id: filteredStations[0].id, name: filteredStations[0].name })
            }
          }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-accent text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-10"
        >
          <Plus size={24} />
        </button>

        {/* Station Detail Modal */}
        <StationDetail
          stationId={selectedStation}
          userLat={location?.lat}
          userLng={location?.lng}
          onClose={() => setSelectedStation(null)}
          onReport={handleReport}
        />

        {/* Report Modal */}
        {reportStation ? (
          <ReportModal
            stationId={reportStation.id}
            stationName={reportStation.name}
            onClose={() => setReportStation(null)}
            onDone={() => refresh()}
          />
        ) : null}
      </div>
    </ToastProvider>
  )
}
