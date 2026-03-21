'use client'

import { useState, useEffect, type ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [checked, setChecked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (sessionStorage.getItem('admin_authed') === '1') {
      setAuthed(true)
    }
    setChecked(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setAuthed(true)
      sessionStorage.setItem('admin_authed', '1')
      sessionStorage.setItem('admin_pwd', password)
    } else {
      setError('รหัสผ่านไม่ถูกต้อง')
    }
  }

  if (!checked) {
    return <div className="min-h-dvh bg-bg" />
  }

  if (!authed) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg px-4">
        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-text">Admin Panel</h1>
            <p className="text-sm text-muted">ใส่รหัสผ่าน Admin</p>
          </div>
          {error ? <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{error}</div> : null}
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="รหัสผ่าน Admin"
          />
          <button className="w-full bg-accent text-white py-2.5 rounded-xl font-medium">เข้าสู่ระบบ</button>
        </form>
      </div>
    )
  }

  return <>{children}</>
}
