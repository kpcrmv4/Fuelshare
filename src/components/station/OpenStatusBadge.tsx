import { memo } from 'react'

export const OpenStatusBadge = memo(function OpenStatusBadge({ isOpen }: { isOpen: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${isOpen ? 'text-green-600' : 'text-red-500'}`}>
      <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
      {isOpen ? 'เปิดอยู่' : 'ปิด'}
    </span>
  )
})
