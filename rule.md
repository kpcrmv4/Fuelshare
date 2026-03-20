# Fuel Station App — Project Rules & Guidelines

> เอกสารนี้เป็น single source of truth สำหรับทุก convention, pattern, และข้อกำหนดของโปรเจค
> ทุกครั้งที่เขียนโค้ด ต้องอ้างอิงจากเอกสารนี้เท่านั้น

---

## 1. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.x |
| Language | TypeScript | 5.x (strict mode) |
| UI | Tailwind CSS | 4.x |
| Map | Leaflet + react-leaflet | 4.x |
| Map Tiles | OpenStreetMap | ฟรี 100% |
| Database | Supabase (PostgreSQL + PostGIS) | — |
| Auth | Supabase Auth (Email) | — |
| Realtime | Supabase Realtime | — |
| Client Fetching | SWR | 2.x |
| Deployment | Vercel | — |
| Package Manager | pnpm | — |

---

## 2. Project Structure

```
fuel-app/
├── src/
│   ├── app/                    # App Router (pages + API routes)
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # หน้าหลัก
│   │   ├── station/[id]/       # รายละเอียดปั๊ม
│   │   ├── staff/              # เจ้าของ/พนักงานปั๊ม
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── dashboard/
│   │   ├── admin/              # Admin panel
│   │   └── api/                # API Routes
│   │       ├── stations/
│   │       ├── reports/
│   │       ├── prices/
│   │       ├── limits/
│   │       ├── comments/
│   │       ├── pending/
│   │       └── removal/
│   │
│   ├── components/             # React components
│   │   ├── map/                # Map-related
│   │   ├── station/            # Station display
│   │   ├── report/             # Report forms
│   │   ├── staff/              # Staff dashboard
│   │   ├── admin/              # Admin panel
│   │   └── ui/                 # Shared UI primitives
│   │
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Utilities + Supabase clients
│   │   └── supabase/
│   └── styles/
│
├── supabase/
│   └── migrations/             # SQL migrations (numbered)
│
├── scripts/                    # One-time scripts (seed, etc.)
└── public/                     # Static assets
```

### กฎการจัดไฟล์
- **1 component = 1 file** ไม่รวมหลาย component ในไฟล์เดียว (ยกเว้น internal sub-component ที่ไม่ export)
- **Named export เท่านั้น** ห้ามใช้ `export default` ยกเว้น page.tsx และ layout.tsx ที่ Next.js บังคับ
- **Colocation**: ไฟล์ที่ใช้ด้วยกัน อยู่ใกล้กัน (เช่น `StationCard.tsx` + `StationCard.test.tsx`)
- **Index files**: ห้ามสร้าง barrel file (`index.ts` ที่ re-export) — import ตรงจากไฟล์ต้นทาง (ตาม `bundle-barrel-imports`)

---

## 3. TypeScript Rules

```typescript
// ✅ ใช้ interface สำหรับ object shapes
interface Station {
  id: number
  name: string
  brand: string
  lat: number
  lng: number
}

// ✅ ใช้ type สำหรับ unions, intersections, utility types
type FuelStatus = 'available' | 'queue' | 'out'
type QueueLevel = 'none' | 'low' | 'medium' | 'high'
type LimitType = 'liters' | 'baht'
type ReportRole = 'anonymous' | 'owner' | 'staff'

// ❌ ห้ามใช้ any — ใช้ unknown แล้ว narrow type แทน
// ❌ ห้ามใช้ as Type — ใช้ type guard หรือ schema validation แทน
// ❌ ห้ามใช้ enum — ใช้ union type + const object แทน
```

### Naming Convention
| สิ่ง | Convention | ตัวอย่าง |
|------|-----------|---------|
| Component | PascalCase | `StationCard.tsx` |
| Hook | camelCase + use prefix | `useNearbyStations.ts` |
| Utility | camelCase | `formatDistance.ts` |
| Type/Interface | PascalCase | `Station`, `FuelData` |
| Constant | UPPER_SNAKE_CASE | `FUEL_TYPES`, `MAX_RADIUS` |
| DB column | snake_case | `station_id`, `fuel_type` |
| API route | kebab-case | `/api/stations/nearby` |
| CSS class | Tailwind utility | ไม่เขียน custom CSS ยกเว้น CSS variables |

---

## 4. React / Next.js Rules (ตาม React Best Practices)

### 4.1 Server vs Client Components

```
DEFAULT = Server Component (ไม่ต้องเขียน directive)

ใช้ 'use client' เฉพาะเมื่อ:
- ใช้ useState, useEffect, useRef
- ใช้ browser API (navigator, window, localStorage)
- ใช้ event handler (onClick, onChange)
- ใช้ SWR, Supabase Realtime
```

### 4.2 Data Fetching

```typescript
// ✅ Server Component: fetch ใน component โดยตรง
async function StationPage({ params }: { params: { id: string } }) {
  const station = await getStation(params.id)
  return <StationDetail station={station} />
}

// ✅ Client Component: ใช้ SWR (ตาม client-swr-dedup)
function StationList() {
  const { data } = useSWR(`/api/stations/nearby?lat=${lat}&lng=${lng}&r=${radius}`, fetcher)
}

// ❌ ห้ามใช้ useEffect + fetch ใน client component
// ❌ ห้ามใช้ getServerSideProps / getStaticProps (App Router ไม่ใช้)
```

### 4.3 Suspense Boundaries (ตาม async-suspense-boundaries)

```tsx
// ✅ แยก Suspense boundary ให้ส่วนที่โหลดเร็วแสดงก่อน
function HomePage() {
  return (
    <div>
      <Header />
      <Suspense fallback={<MapSkeleton />}>
        <RadarMap />              {/* โหลดแยก */}
      </Suspense>
      <Suspense fallback={<ListSkeleton />}>
        <StationList />           {/* โหลดแยก */}
      </Suspense>
    </div>
  )
}
```

### 4.4 Dynamic Import (ตาม bundle-dynamic-imports)

```typescript
// ✅ Leaflet ต้อง dynamic import เสมอ (ไม่รองรับ SSR)
import dynamic from 'next/dynamic'
const RadarMap = dynamic(() => import('@/components/map/RadarMap').then(m => m.RadarMap), {
  ssr: false,
  loading: () => <MapSkeleton />
})

// ✅ Modal/Dialog ที่ไม่แสดงตอนแรก → dynamic import
const ReportModal = dynamic(() => import('@/components/report/ReportModal').then(m => m.ReportModal))
```

### 4.5 Performance (ตาม rerender-*)

```typescript
// ✅ React.memo สำหรับ list items
const StationCard = memo(function StationCard({ station }: { station: Station }) {
  // ...
})

// ✅ Derived state คำนวณตอน render (ไม่ใช้ useEffect)
function StationList({ stations, filter }: Props) {
  const filtered = useMemo(
    () => stations.filter(s => filter === 'all' || s.brand === filter),
    [stations, filter]
  )
}

// ✅ useRef สำหรับค่าที่เปลี่ยนบ่อยแต่ไม่ต้อง re-render (เช่น map center)
const mapCenterRef = useRef({ lat: 0, lng: 0 })
```

### 4.6 Conditional Rendering

```tsx
// ✅ ใช้ ternary
{isOpen ? <OpenBadge /> : <ClosedBadge />}

// ❌ ห้ามใช้ && (อาจ render "0" หรือ "false")
{count && <Badge count={count} />}  // ❌ ถ้า count = 0 จะ render "0"
{count > 0 ? <Badge count={count} /> : null}  // ✅
```

---

## 5. Supabase / Database Rules (ตาม Supabase Best Practices)

### 5.1 Schema Design

```sql
-- ✅ Primary Key: bigint identity (ไม่ใช่ UUID v4)
id bigint generated always as identity primary key

-- ✅ Text: ใช้ text (ไม่ใช่ varchar)
name text not null

-- ✅ Timestamp: ใช้ timestamptz เสมอ
created_at timestamptz default now()

-- ✅ Money/Price: ใช้ numeric (ไม่ใช่ float)
price numeric(6,2)

-- ✅ Enum: ใช้ text + check constraint
status text not null check (status in ('available','queue','out'))

-- ✅ Geography: ใช้ PostGIS geography type
location geography(Point, 4326) not null
```

### 5.2 Indexes

```sql
-- ✅ ทุก Foreign Key ต้องมี index
create index fuel_status_station_idx on fuel_status (station_id);

-- ✅ ทุก column ที่ใช้ใน WHERE ต้องมี index
create index stations_province_idx on stations (province);

-- ✅ Partial index สำหรับ filtered queries
create index stations_active_idx on stations (province) where status = 'active';

-- ✅ Composite index สำหรับ query ที่ filter หลาย column
create index fuel_prices_lookup_idx on fuel_prices (station_id, fuel_type, created_at desc);

-- ✅ GIST index สำหรับ spatial query
create index stations_location_gist on stations using gist (location);
```

### 5.3 Row Level Security (RLS)

```sql
-- ✅ ทุกตารางต้อง enable RLS
alter table stations enable row level security;

-- ✅ ใช้ (select auth.uid()) ใน subquery (เรียกครั้งเดียว, ไม่ใช่ต่อแถว)
create policy "Staff can update" on stations
  for update using (
    exists (
      select 1 from station_staff
      where station_id = stations.id
        and auth_user_id = (select auth.uid())  -- ✅ wrapped
        and verified = true
    )
  );

-- ❌ ห้าม: auth.uid() = user_id  (เรียกทุกแถว ช้ามาก)
-- ✅ ใช้: (select auth.uid()) = user_id
```

### 5.4 Supabase Client Usage

```typescript
// ✅ Browser client (components/hooks)
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ✅ Server client (API routes, Server Components)
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
}

// ✅ Admin client (service_role — ใช้เฉพาะ server-side, bypass RLS)
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // ❌ ห้าม expose ไป client
)
```

### 5.5 Query Patterns

```typescript
// ✅ ใช้ DB function สำหรับ complex query (ลด N+1)
const { data } = await supabase.rpc('get_nearby_stations', {
  user_lat: lat,
  user_lng: lng,
  radius_m: radius,
  max_results: 50
})

// ✅ Cursor-based pagination สำหรับ comments
const { data } = await supabase
  .from('comments')
  .select('*')
  .eq('station_id', stationId)
  .order('created_at', { ascending: false })
  .lt('created_at', cursor)  // cursor = last item's created_at
  .limit(10)

// ❌ ห้ามใช้ offset pagination
// ❌ ห้าม select('*') ถ้าไม่จำเป็น — select เฉพาะ column ที่ใช้
```

---

## 6. API Route Rules

### 6.1 Structure

```typescript
// src/app/api/stations/nearby/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  // 1. Parse & validate input
  const { searchParams } = request.nextUrl
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')
  const radius = parseInt(searchParams.get('r') ?? '20000')

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }

  // 2. Query
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('get_nearby_stations', {
    user_lat: lat,
    user_lng: lng,
    radius_m: Math.min(radius, 50000),  // cap at 50km
    max_results: 50
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 3. Return
  return NextResponse.json(data)
}
```

### 6.2 กฎ API
- **Validate ทุก input** ที่ system boundary (API route)
- **Rate limit** ทุก POST endpoint (IP-based)
- **ไม่ส่ง error detail ไป client** ใน production — log ไว้ server-side
- **Cap ค่า input**: radius สูงสุด 50 กม., limit สูงสุด 100 results
- **Admin endpoint**: ใช้ `supabaseAdmin` (service_role) + ตรวจ admin password/role

---

## 7. Styling Rules (Tailwind CSS)

### 7.1 Theme System

```css
/* src/styles/globals.css */
:root {
  --accent: 14 186 197;        /* #0EBAC5 cyan */
  --bg: 248 250 252;
  --surface: 255 255 255;
  --text: 15 23 42;
  --sub: 71 85 105;
  --muted: 148 163 184;
  --border: 0 0 0 / 0.08;
}

[data-theme="dark"] {
  --accent: 34 211 238;
  --bg: 11 17 32;
  --surface: 21 31 50;
  --text: 241 245 249;
  --sub: 148 163 184;
  --muted: 100 116 139;
  --border: 255 255 255 / 0.08;
}
```

### 7.2 กฎ Styling
- **Tailwind utility เท่านั้น** — ไม่เขียน custom CSS ยกเว้น CSS variables, keyframes, Leaflet overrides
- **ห้ามใช้ `@apply`** ใน CSS file — ถ้าต้อง reuse ให้สร้าง component
- **Responsive**: mobile-first (`sm:`, `md:`, `lg:`)
- **Dark mode**: ใช้ `data-theme` attribute + CSS variables (ไม่ใช่ Tailwind `dark:`)
- **Font**: Noto Sans Thai (Google Fonts) + system fallback
- **Spacing**: ใช้ Tailwind scale (4, 8, 12, 16, 20, 24...)
- **Border radius**: `rounded-lg` (14px) เป็นค่าเริ่มต้นของ card

---

## 8. Component Patterns

### 8.1 Badge Components (สถานะต่างๆ)

```tsx
// ทุก badge ใช้ pattern เดียวกัน
interface BadgeProps {
  variant: string
  children: React.ReactNode
  size?: 'sm' | 'md'
}

// Status colors (ใช้ทุกที่เหมือนกัน)
const STATUS_COLORS = {
  available: 'bg-green-500',
  queue: 'bg-orange-500',
  out: 'bg-red-500',
  unknown: 'bg-gray-400',
} as const

const QUEUE_COLORS = {
  none: 'text-green-600',
  low: 'text-yellow-600',
  medium: 'text-orange-600',
  high: 'text-red-600',
} as const
```

### 8.2 Modal Pattern

```tsx
// ใช้ dialog element (native, accessible)
function Modal({ open, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  // ...
}

// Multi-step modal ใช้ state machine (ไม่ใช่ useState index)
type ReportStep = 'select-fuel' | 'set-status' | 'set-price' | 'set-limit' | 'confirm'
```

### 8.3 Form Pattern

```tsx
// ใช้ server action หรือ API route + SWR mutation
// ห้ามใช้ uncontrolled form ที่ไม่ validate

// ✅ Validate ด้วย Zod schema
import { z } from 'zod'

const reportSchema = z.object({
  station_id: z.number().int().positive(),
  fuel_type: z.string().min(1),
  status: z.enum(['available', 'queue', 'out']),
  queue_level: z.enum(['none', 'low', 'medium', 'high']).optional(),
  price: z.number().positive().max(99.99).optional(),
})
```

---

## 9. Map Rules (Leaflet)

```typescript
// ✅ Dynamic import เสมอ
const RadarMap = dynamic(() => import('@/components/map/RadarMap'), { ssr: false })

// ✅ Radar circle
// - ค่าเริ่มต้น: 20 กม.
// - ผู้ใช้ปรับได้: 5 - 50 กม. (step 5 กม.)
// - เปลี่ยนรัศมี → fetch ใหม่จาก API (debounce 500ms)

// ✅ Markers
// - ใช้ DivIcon (custom HTML, ไม่ใช่ image)
// - แสดงสี brand + สถานะ dot
// - คลิก marker → fetch station detail (1 request)
// - ไม่โหลดข้อมูลเต็มตอนแสดง marker

// ✅ Map interaction
// - Pan/zoom ใช้ ref (ไม่ trigger React re-render)
// - เลื่อน map เกินรัศมี → แสดงปุ่ม "ค้นหาในพื้นที่นี้"
// - ไม่ auto-fetch ตอนเลื่อน (ประหยัด bandwidth)

// ✅ User location
// - ขอ permission ครั้งเดียว
// - แสดง blue dot + accuracy circle
// - ปุ่ม "กลับตำแหน่งฉัน"
```

---

## 10. Data Flow

### 10.1 Anonymous User (ผู้ใช้ทั่วไป)

```
เปิดแอป → ขอ GPS → ได้ lat/lng
  → GET /api/stations/nearby?lat=X&lng=Y&r=20000
  → Supabase RPC get_nearby_stations()
  → แสดง map pins + station list

คลิกปั๊ม → GET /api/stations/[id]
  → แสดง detail + fuel status + ราคา + ขีดจำกัด + comments

รายงาน → POST /api/reports (สถานะ)
       → POST /api/prices (ราคา)          # optional
       → POST /api/limits (ขีดจำกัด)      # optional
  → rate limit check → insert → invalidate SWR cache
```

### 10.2 เจ้าของ/พนักงานปั๊ม

```
Login (Email) → Supabase Auth → JWT token
  → GET station_staff (ดูปั๊มที่ตัวเองดูแล)
  → Staff Dashboard

อัปเดตสถานะ → POST /api/reports (reported_by_role = 'owner')
อัปเดตราคา → POST /api/prices (reported_by_role = 'owner')
ตั้งขีดจำกัด → POST /api/limits (reported_by_role = 'owner')
เปิด/ปิดปั๊ม → PATCH /api/stations/[id] (is_open)

  → Supabase Realtime → ผู้ใช้ทั่วไปเห็นทันที
  → Badge "อัปเดตโดยเจ้าของปั๊ม"
```

### 10.3 Admin

```
Login (password) → session cookie

Dashboard → GET admin stats (service_role)
Pending → GET/PATCH pending_stations
Removal → GET/PATCH removal_requests
Comments → GET/DELETE comments
Staff verify → PATCH station_staff.verified = true
```

---

## 11. Realtime Rules (Supabase Realtime)

```typescript
// ✅ Subscribe เฉพาะตารางที่จำเป็น + filter
const channel = supabase
  .channel('station-updates')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'fuel_status',
    filter: `station_id=eq.${stationId}`  // ✅ filter เฉพาะปั๊มที่กำลังดู
  }, handleUpdate)
  .subscribe()

// ✅ Cleanup subscription ตอน unmount
useEffect(() => {
  const channel = subscribe()
  return () => { supabase.removeChannel(channel) }
}, [stationId])

// ❌ ห้าม subscribe ทั้งตาราง (กิน connection)
// ❌ ห้าม subscribe ถ้า user ไม่ได้อยู่ในหน้า detail
```

---

## 12. Security Rules

### 12.1 Input Validation
- ทุก API route ต้อง validate input ด้วย Zod
- Sanitize text input (strip HTML tags)
- ห้าม trust client-sent user_id — ใช้ `auth.uid()` จาก JWT เสมอ

### 12.2 Rate Limiting
- Report: สูงสุด 10 ครั้ง/IP/ชั่วโมง
- Comment: สูงสุด 5 ครั้ง/IP/ชั่วโมง
- Vote: สูงสุด 20 ครั้ง/IP/ชั่วโมง
- Price report: สูงสุด 10 ครั้ง/IP/ชั่วโมง

### 12.3 Environment Variables

```env
# ✅ Public (ส่งไป client ได้)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# ❌ Secret (server-side เท่านั้น)
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
```

---

## 13. Performance Budget

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s |
| FID (First Input Delay) | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
| API response (nearby) | < 200ms |
| Bundle size (initial JS) | < 150 KB gzipped |
| Map load time | < 1s (after JS loaded) |

---

## 14. Fuel Types Reference

```typescript
export const FUEL_TYPES = {
  diesel_b7: { name: 'ดีเซล B7', category: 'diesel', color: '#1D4ED8' },
  diesel_b20: { name: 'ดีเซล B20', category: 'diesel', color: '#2563EB' },
  diesel_premium: { name: 'ดีเซลพรีเมียม', category: 'diesel', color: '#1E40AF' },
  gasohol_91: { name: 'แก๊สโซฮอล์ 91', category: 'gasohol', color: '#059669' },
  gasohol_95: { name: 'แก๊สโซฮอล์ 95', category: 'gasohol', color: '#10B981' },
  gasohol_e20: { name: 'แก๊สโซฮอล์ E20', category: 'gasohol', color: '#34D399' },
  gasohol_e85: { name: 'แก๊สโซฮอล์ E85', category: 'gasohol', color: '#6EE7B7' },
  benzene_95: { name: 'เบนซิน 95', category: 'benzene', color: '#DC2626' },
  ngv: { name: 'NGV', category: 'gas', color: '#7C3AED' },
  lpg: { name: 'LPG', category: 'gas', color: '#8B5CF6' },
} as const

export type FuelType = keyof typeof FUEL_TYPES
export type FuelCategory = 'diesel' | 'gasohol' | 'benzene' | 'gas'
```

---

## 15. Brand Reference

```typescript
export const BRANDS = {
  'PTT': { color: '#1E3A8A', textColor: '#FFFFFF' },
  'Shell': { color: '#FFD500', textColor: '#000000' },
  'Caltex': { color: '#E11D48', textColor: '#FFFFFF' },
  'BCP (บางจาก)': { color: '#16A34A', textColor: '#FFFFFF' },
  'Esso': { color: '#1D4ED8', textColor: '#FFFFFF' },
  'PT': { color: '#F97316', textColor: '#FFFFFF' },
  'Susco': { color: '#9333EA', textColor: '#FFFFFF' },
  'พีที': { color: '#EA580C', textColor: '#FFFFFF' },
  'อื่นๆ': { color: '#6B7280', textColor: '#FFFFFF' },
} as const
```

---

## 16. Git Rules

- **Branch**: `main` (production), `dev` (development), `feat/*`, `fix/*`
- **Commit message**: ภาษาอังกฤษ, ขึ้นต้นด้วย verb (add, fix, update, refactor, remove)
- **ห้าม commit**: `.env`, `node_modules/`, `.next/`
- **ห้าม force push** ไป `main`
