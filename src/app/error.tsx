'use client'

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-bg px-4">
      <p className="text-6xl mb-4">😵</p>
      <h1 className="text-xl font-bold text-text mb-2">เกิดข้อผิดพลาด</h1>
      <p className="text-sm text-muted mb-6">กรุณาลองใหม่อีกครั้ง</p>
      <button
        onClick={reset}
        className="bg-accent text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:opacity-90"
      >
        ลองใหม่
      </button>
    </div>
  )
}
