'use client'

import { RADAR_MIN_KM, RADAR_MAX_KM, RADAR_STEP_KM } from '@/lib/constants'

interface RadarSliderProps {
  radiusKm: number
  onChange: (km: number) => void
}

export function RadarSlider({ radiusKm, onChange }: RadarSliderProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <span className="text-xs text-muted whitespace-nowrap">{RADAR_MIN_KM} กม.</span>
      <input
        type="range"
        min={RADAR_MIN_KM}
        max={RADAR_MAX_KM}
        step={RADAR_STEP_KM}
        value={radiusKm}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="flex-1 h-1.5 bg-border rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer"
      />
      <span className="text-xs text-muted whitespace-nowrap">{RADAR_MAX_KM} กม.</span>
      <span className="text-sm font-semibold text-accent min-w-[3.5rem] text-right">{radiusKm} กม.</span>
    </div>
  )
}
