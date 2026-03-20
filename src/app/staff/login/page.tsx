'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function StaffLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      setLoading(false)
      return
    }

    router.push('/staff/dashboard')
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-accent" />
          </div>
          <h1 className="text-xl font-bold text-text">เข้าสู่ระบบพนักงาน / เจ้าของปั๊ม</h1>
          <p className="text-sm text-muted mt-1">จัดการสถานะปั๊มของคุณ</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error ? (
            <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-xl border border-red-500/20">{error}</div>
          ) : null}

          <div>
            <label className="text-sm font-medium text-sub block mb-1">อีเมล</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-muted"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-sub block mb-1">รหัสผ่าน</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-muted"
              placeholder="รหัสผ่าน"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white py-2.5 rounded-xl font-medium disabled:opacity-50 transition-opacity"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link href="/staff/register" className="text-sm text-accent hover:underline">
            สมัครเป็นพนักงาน / เจ้าของปั๊ม
          </Link>
          <span className="mx-2 text-muted">·</span>
          <Link href="/" className="text-sm text-muted hover:underline">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  )
}
