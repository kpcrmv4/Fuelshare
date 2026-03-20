export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-bg px-4">
      <p className="text-6xl mb-4">⛽</p>
      <h1 className="text-xl font-bold text-text mb-2">ไม่พบหน้าที่ค้นหา</h1>
      <p className="text-sm text-muted mb-6">หน้านี้อาจถูกลบหรือย้ายไปที่อื่น</p>
      <a href="/" className="bg-accent text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:opacity-90">
        กลับหน้าหลัก
      </a>
    </div>
  )
}
