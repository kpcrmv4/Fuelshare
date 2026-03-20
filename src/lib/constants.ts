// ═══════════════════════════════════════
// Fuel Types
// ═══════════════════════════════════════
export const FUEL_TYPES = {
  diesel_b7: { name: 'ดีเซล B7', category: 'diesel' as const, color: '#1D4ED8' },
  diesel_b20: { name: 'ดีเซล B20', category: 'diesel' as const, color: '#2563EB' },
  diesel_premium: { name: 'ดีเซลพรีเมียม', category: 'diesel' as const, color: '#1E40AF' },
  gasohol_91: { name: 'แก๊สโซฮอล์ 91', category: 'gasohol' as const, color: '#059669' },
  gasohol_95: { name: 'แก๊สโซฮอล์ 95', category: 'gasohol' as const, color: '#10B981' },
  gasohol_e20: { name: 'แก๊สโซฮอล์ E20', category: 'gasohol' as const, color: '#34D399' },
  gasohol_e85: { name: 'แก๊สโซฮอล์ E85', category: 'gasohol' as const, color: '#6EE7B7' },
  benzene_95: { name: 'เบนซิน 95', category: 'benzene' as const, color: '#DC2626' },
  ngv: { name: 'NGV', category: 'gas' as const, color: '#7C3AED' },
  lpg: { name: 'LPG', category: 'gas' as const, color: '#8B5CF6' },
} as const

export type FuelType = keyof typeof FUEL_TYPES
export type FuelCategory = 'all' | 'diesel' | 'gasohol' | 'benzene' | 'gas'

export const FUEL_CATEGORIES: { key: FuelCategory; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'diesel', label: 'ดีเซล' },
  { key: 'gasohol', label: 'แก๊สโซฮอล์' },
  { key: 'benzene', label: 'เบนซิน' },
  { key: 'gas', label: 'NGV/LPG' },
]

// ═══════════════════════════════════════
// Brands
// ═══════════════════════════════════════
export const BRANDS: Record<string, { color: string; textColor: string; logo?: string }> = {
  'PTT': { color: '#1E3A8A', textColor: '#FFFFFF', logo: '/brands/ptt.png' },
  'Shell': { color: '#FFD500', textColor: '#000000', logo: '/brands/shell.png' },
  'Caltex': { color: '#E11D48', textColor: '#FFFFFF', logo: '/brands/caltex.png' },
  'BCP (บางจาก)': { color: '#16A34A', textColor: '#FFFFFF', logo: '/brands/bangchak.png' },
  'Bangchak': { color: '#16A34A', textColor: '#FFFFFF', logo: '/brands/bangchak.png' },
  'Esso': { color: '#1D4ED8', textColor: '#FFFFFF', logo: '/brands/esso.png' },
  'PT': { color: '#F97316', textColor: '#FFFFFF', logo: '/brands/pt.png' },
  'Susco': { color: '#9333EA', textColor: '#FFFFFF', logo: '/brands/susco.png' },
  'พีที': { color: '#EA580C', textColor: '#FFFFFF', logo: '/brands/pt.png' },
  'อื่นๆ': { color: '#6B7280', textColor: '#FFFFFF' },
}

export const MAJOR_BRANDS = new Set([
  'PTT', 'Shell', 'Caltex', 'BCP (บางจาก)', 'Bangchak', 'Esso', 'PT', 'Susco', 'พีที',
])

export function isMajorBrand(brand: string) {
  if (MAJOR_BRANDS.has(brand)) return true
  for (const m of MAJOR_BRANDS) {
    if (brand.includes(m) || m.includes(brand)) return true
  }
  return false
}

export function getBrandInfo(brand: string) {
  const exact = BRANDS[brand]
  if (exact) return exact
  const key = Object.keys(BRANDS).find((k) => brand.includes(k) || k.includes(brand))
  return key ? BRANDS[key] : BRANDS['อื่นๆ']
}

// ═══════════════════════════════════════
// Status
// ═══════════════════════════════════════
export const STATUS_CONFIG = {
  available: { label: 'มีน้ำมัน', color: '#16A34A', bgClass: 'bg-green-500' },
  queue: { label: 'มีคิว', color: '#EA580C', bgClass: 'bg-orange-500' },
  out: { label: 'หมด', color: '#DC2626', bgClass: 'bg-red-500' },
  unknown: { label: 'ไม่ทราบ', color: '#9CA3AF', bgClass: 'bg-gray-400' },
} as const

export const QUEUE_CONFIG = {
  none: { label: 'ไม่มีคิว', color: '#16A34A' },
  low: { label: 'คิวน้อย', color: '#EAB308' },
  medium: { label: 'คิวปานกลาง', color: '#EA580C' },
  high: { label: 'คิวยาว', color: '#DC2626' },
} as const

// ═══════════════════════════════════════
// Radar
// ═══════════════════════════════════════
export const RADAR_DEFAULT_KM = 20
export const RADAR_MIN_KM = 5
export const RADAR_MAX_KM = 50
export const RADAR_STEP_KM = 5

// ═══════════════════════════════════════
// Rate Limits
// ═══════════════════════════════════════
export const RATE_LIMITS = {
  report: { max: 10, windowMs: 60 * 60 * 1000 },
  comment: { max: 5, windowMs: 60 * 60 * 1000 },
  vote: { max: 20, windowMs: 60 * 60 * 1000 },
  price: { max: 10, windowMs: 60 * 60 * 1000 },
} as const
