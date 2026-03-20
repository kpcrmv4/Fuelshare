'use client'

import { FUEL_CATEGORIES, type FuelCategory } from '@/lib/constants'

interface FilterChipsProps {
  selected: FuelCategory
  onChange: (category: FuelCategory) => void
}

export function FilterChips({ selected, onChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-2">
      {FUEL_CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onChange(cat.key)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
            ${selected === cat.key
              ? 'bg-accent text-white'
              : 'bg-surface text-sub border border-border hover:bg-surface-hover'
            }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}
