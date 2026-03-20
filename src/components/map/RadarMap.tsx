'use client'

import { useRef, useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Station } from '@/lib/supabase/types'
import { getBrandInfo, STATUS_CONFIG } from '@/lib/constants'

interface RadarMapProps {
  center: { lat: number; lng: number }
  radiusM: number
  stations: Station[]
  onStationClick: (station: Station) => void
}

function createStationIcon(brand: string, status?: string) {
  const brandInfo = getBrandInfo(brand)
  const statusColor = status ? STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color ?? '#9CA3AF' : '#9CA3AF'

  const inner = brandInfo.logo
    ? `<img src="${brandInfo.logo}" style="width:30px;height:30px;border-radius:50%;object-fit:contain;background:white;" />`
    : `<span style="color:${brandInfo.textColor};font-size:14px;font-weight:700;">${brand.charAt(0)}</span>`

  return L.divIcon({
    className: '',
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -42],
    html: `
      <div style="position:relative;width:36px;height:42px;">
        <div style="width:36px;height:36px;border-radius:50%;background:${brandInfo.logo ? 'white' : brandInfo.color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          ${inner}
        </div>
        <div style="position:absolute;top:-2px;right:-2px;width:12px;height:12px;border-radius:50%;background:${statusColor};border:2px solid white;"></div>
        <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid white;"></div>
      </div>
    `,
  })
}

const userIcon = L.divIcon({
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  html: `
    <div style="position:relative;width:20px;height:20px;">
      <div style="width:14px;height:14px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 0 8px rgba(59,130,246,0.5);position:absolute;top:3px;left:3px;z-index:2;"></div>
      <div class="user-pulse" style="width:20px;height:20px;border-radius:50%;background:rgba(59,130,246,0.3);position:absolute;top:0;left:0;"></div>
    </div>
  `,
})

function MapUpdater({ center, zoom }: { center: { lat: number; lng: number }; zoom?: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom ?? map.getZoom())
  }, [map, center.lat, center.lng, zoom])
  return null
}

export function RadarMap({ center, radiusM, stations, onStationClick }: RadarMapProps) {
  const [mapKey] = useState(() => Date.now())
  const mapRef = useRef(null)

  const markers = useMemo(() => {
    if (!Array.isArray(stations)) return []
    return stations.map((station) => {
      const mainStatus = station.fuel_data[0]?.status
      const icon = createStationIcon(station.brand, mainStatus)
      return { station, icon }
    })
  }, [stations])

  return (
    <div className="relative w-full h-[45vh] md:h-[50vh]">
      <MapContainer
        key={mapKey}
        ref={mapRef}
        center={[center.lat, center.lng]}
        zoom={12}
        className="w-full h-full z-[1]"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} />

        {/* Radar circle */}
        <Circle
          center={[center.lat, center.lng]}
          radius={radiusM}
          pathOptions={{
            color: '#0EBAC5',
            fillColor: '#0EBAC5',
            fillOpacity: 0.08,
            weight: 2,
            dashArray: '8 4',
          }}
        />

        {/* User location */}
        <Marker position={[center.lat, center.lng]} icon={userIcon} />

        {/* Station markers */}
        {markers.map(({ station, icon }) => (
          <Marker
            key={station.id}
            position={[station.lat, station.lng]}
            icon={icon}
            eventHandlers={{
              click: () => onStationClick(station),
            }}
          />
        ))}
      </MapContainer>
    </div>
  )
}
