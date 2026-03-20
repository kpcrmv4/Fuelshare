import { type ClassValue, clsx } from 'clsx'

// Simple clsx replacement (no need for tailwind-merge yet)
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDistance(meters: number | null): string {
  if (meters === null) return ''
  if (meters < 1000) return `${Math.round(meters)} ม.`
  return `${(meters / 1000).toFixed(1)} กม.`
}

export function formatPrice(price: number | null): string {
  if (price === null) return '-'
  return `฿${price.toFixed(2)}`
}

export function formatTimeAgo(minutes: number): string {
  if (minutes < 1) return 'เมื่อสักครู่'
  if (minutes < 60) return `${Math.round(minutes)} นาทีที่แล้ว`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
  const days = Math.floor(hours / 24)
  return `${days} วันที่แล้ว`
}

export function formatLimit(type: string | null, amount: number | null): string {
  if (!type || !amount) return ''
  if (type === 'baht') return `ไม่เกิน ${amount.toLocaleString()} บาท/คัน`
  return `ไม่เกิน ${amount.toLocaleString()} ลิตร/คัน`
}

export function hashIP(ip: string): string {
  // Simple hash for anonymous tracking
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return 'ip_' + Math.abs(hash).toString(36)
}

export function getClientIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}
