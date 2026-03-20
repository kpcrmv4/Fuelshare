'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Search, MapPin, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface StationOption {
  id: number
  name: string
  brand: string
  distance_m?: number
}

export default function StaffRegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<'owner' | 'staff'>('staff')
  const [stationSearch, setStationSearch] = useState('')
  const [stationResults, setStationResults] = useState<StationOption[]>([])
  const [selectedStation, setSelectedStation] = useState<StationOption | null>(null)
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const searchStations = async (query: string) => {
    setStationSearch(query)
    if (query.length < 2) {
      setStationResults([])
      return
    }
    setSearching(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('stations')
        .select('id, name, brand')
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
        .limit(5)
      setStationResults(data ?? [])
    } finally {
      setSearching(false)
    }
  }

  const findNearbyStations = () => {
    if (!navigator.geolocation) {
      setError('เบราว์เซอร์ไม่รองรับ GPS')
      return
    }
    setLocating(true)
    setStationResults([])
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/stations/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&r=10000`
          )
          const data = await res.json()
          const stations: StationOption[] = (Array.isArray(data) ? data : []).map(
            (s: { id: number; name: string; brand: string; distance_m: number }) => ({
              id: s.id,
              name: s.name,
              brand: s.brand,
              distance_m: s.distance_m,
            })
          )
          setStationResults(stations)
          if (stations.length === 0) {
            setError('ไม่พบปั๊มในรัศมี 10 กม.')
          }
        } finally {
          setLocating(false)
        }
      },
      () => {
        setError('ไม่สามารถหาตำแหน่งได้ กรุณาอนุญาตการเข้าถึง GPS')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStation) {
      setError('กรุณาเลือกปั๊มที่ต้องการจัดการ')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError || !authData.user) {
      setError(authError?.message ?? 'สมัครไม่สำเร็จ')
      setLoading(false)
      return
    }

    const { error: staffError } = await supabase
      .from('station_staff')
      .insert({
        auth_user_id: authData.user.id,
        station_id: selectedStation.id,
        role,
        display_name: displayName,
        verified: false,
      })

    if (staffError) {
      setError('ไม่สามารถลงทะเบียนได้ อาจมีบัญชีนี้อยู่แล้ว')
      setLoading(false)
      return
    }

    router.push('/staff/dashboard')
  }

  const formatDist = (m?: number) => {
    if (!m) return ''
    return m < 1000 ? `${m} ม.` : `${(m / 1000).toFixed(1)} กม.`
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-accent" />
          </div>
          <h1 className="text-xl font-bold text-text">สมัครพนักงาน / เจ้าของปั๊ม</h1>
          <p className="text-sm text-muted mt-1">สร้างบัญชีเพื่อจัดการปั๊มของคุณ</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error ? (
            <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-xl border border-red-500/20">{error}</div>
          ) : null}

          <div>
            <label className="text-sm font-medium text-sub block mb-1">ชื่อที่แสดง</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-muted"
              placeholder="เช่น สมชาย"
            />
          </div>

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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-muted"
              placeholder="อย่างน้อย 6 ตัวอักษร"
            />
          </div>

          {/* Role selection */}
          <div>
            <label className="text-sm font-medium text-sub block mb-1.5">ตำแหน่ง</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('staff')}
                className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  role === 'staff'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-sub hover:border-accent/30'
                }`}
              >
                พนักงาน
              </button>
              <button
                type="button"
                onClick={() => setRole('owner')}
                className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  role === 'owner'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-sub hover:border-accent/30'
                }`}
              >
                เจ้าของปั๊ม
              </button>
            </div>
          </div>

          {/* Station selection */}
          <div>
            <label className="text-sm font-medium text-sub block mb-1.5">เลือกปั๊มที่ทำงาน</label>

            {selectedStation ? (
              <div className="flex items-center justify-between bg-accent/10 border border-accent/30 rounded-xl px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium text-text">{selectedStation.name}</p>
                  <p className="text-xs text-muted">
                    {selectedStation.brand}
                    {selectedStation.distance_m ? ` · ${formatDist(selectedStation.distance_m)}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedStation(null); setStationSearch(''); setStationResults([]) }}
                  className="text-xs text-accent hover:underline"
                >
                  เปลี่ยน
                </button>
              </div>
            ) : (
              <>
                {/* GPS button */}
                <button
                  type="button"
                  onClick={findNearbyStations}
                  disabled={locating}
                  className="w-full flex items-center justify-center gap-2 bg-accent/10 border border-accent/30 text-accent rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-accent/20 transition-colors disabled:opacity-50 mb-2"
                >
                  {locating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <MapPin size={16} />
                  )}
                  {locating ? 'กำลังหาตำแหน่ง...' : 'หาปั๊มใกล้ฉัน'}
                </button>

                {/* Or search */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={stationSearch}
                    onChange={(e) => searchStations(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-muted"
                    placeholder="หรือพิมพ์ชื่อปั๊ม / แบรนด์..."
                  />
                </div>

                {/* Results dropdown */}
                {stationResults.length > 0 ? (
                  <div className="mt-2 bg-surface border border-border rounded-xl overflow-hidden shadow-lg">
                    {stationResults.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedStation(s)
                          setStationResults([])
                          setStationSearch('')
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-surface-hover transition-colors border-b border-border last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-text">{s.name}</p>
                            <p className="text-xs text-muted">{s.brand}</p>
                          </div>
                          {s.distance_m ? (
                            <span className="text-xs text-accent font-medium">{formatDist(s.distance_m)}</span>
                          ) : null}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : stationSearch.length >= 2 && !searching ? (
                  <div className="mt-2 bg-surface border border-border rounded-xl px-4 py-3">
                    <p className="text-xs text-muted">ไม่พบปั๊มที่ตรงกัน</p>
                  </div>
                ) : null}
              </>
            )}
            <p className="text-xs text-muted mt-1.5">ต้องรอ Admin ยืนยันก่อนจึงจะอัปเดตข้อมูลได้</p>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedStation}
            className="w-full bg-accent text-white py-2.5 rounded-xl font-medium disabled:opacity-40 transition-opacity"
          >
            {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <div className="text-center mt-4 space-x-2">
          <Link href="/staff/login" className="text-sm text-accent hover:underline">
            มีบัญชีแล้ว? เข้าสู่ระบบ
          </Link>
          <span className="text-muted">·</span>
          <Link href="/" className="text-sm text-muted hover:underline">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  )
}
