# แผนย้าย Fuel App → Next.js (Vercel) + Supabase

## สถาปัตยกรรมรวม

```
┌───────────────────┐     ┌─────────────────────────┐
│  Next.js 15       │────▶│  Supabase               │
│  App Router       │     │  PostgreSQL + PostGIS    │
│  (Deploy: Vercel) │     │  Auth (เจ้าของปั๊ม)      │
│                   │     │  Realtime (สถานะ live)    │
│  - Server Comp.   │     │  Storage (รูปปั๊ม)       │
│  - API Routes     │     └─────────────────────────┘
│  - Leaflet Map    │
│  - SWR (client)   │     ┌─────────────────────────┐
│  - Tailwind CSS   │     │  Google Places API      │
└───────────────────┘     │  (ใช้ครั้งเดียว seed)    │
                          └─────────────────────────┘
```

---

## Database Schema (ตาม Supabase Best Practices)

### หลักการออกแบบ
- **PK**: ใช้ `bigint generated always as identity` (ตาม schema-primary-keys)
- **Data types**: `text` แทน `varchar`, `timestamptz` แทน `timestamp`, `numeric` สำหรับราคา (ตาม schema-data-types)
- **Index**: ทุก FK column + ทุก column ที่ใช้ WHERE/JOIN (ตาม query-missing-indexes, schema-foreign-key-indexes)
- **RLS**: ทุกตาราง enable RLS + ใช้ `(select auth.uid())` แทน `auth.uid()` (ตาม security-rls-performance)
- **Partial Index**: สำหรับ status = 'active', status = 'pending' (ตาม query-partial-indexes)
- **PostGIS**: GIST index บน geography column สำหรับ spatial query

### ตาราง

```sql
-- ═══════════════════════════════════════
-- 1. stations — ปั๊มน้ำมัน
-- ═══════════════════════════════════════
create table stations (
  id bigint generated always as identity primary key,
  place_id text unique,
  name text not null,
  brand text not null default 'อื่นๆ',
  location geography(Point, 4326) not null,
  address text,
  province text not null,
  is_open boolean default true,
  open_hours jsonb,            -- {"mon":"06:00-22:00","tue":"06:00-22:00",...}
  source text not null default 'google_maps',  -- google_maps / manual / import
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index stations_location_gist on stations using gist (location);
create index stations_province_idx on stations (province) where status = 'active';
create index stations_brand_idx on stations (brand) where status = 'active';
create index stations_place_id_idx on stations (place_id);

-- ═══════════════════════════════════════
-- 2. fuel_prices — ราคาน้ำมันจริงแต่ละปั๊ม
-- ═══════════════════════════════════════
create table fuel_prices (
  id bigint generated always as identity primary key,
  station_id bigint not null references stations(id) on delete cascade,
  fuel_type text not null,
  price numeric(6,2) not null,
  reported_by_role text not null default 'anonymous', -- anonymous / owner / staff
  reported_by_user bigint references station_staff(id),
  ip_hash text,
  created_at timestamptz default now()
);

create index fuel_prices_station_idx on fuel_prices (station_id, fuel_type, created_at desc);

-- View: ราคาล่าสุดของแต่ละปั๊ม+ชนิดน้ำมัน
create view fuel_prices_latest as
select distinct on (station_id, fuel_type)
  id, station_id, fuel_type, price, reported_by_role, created_at
from fuel_prices
order by station_id, fuel_type, created_at desc;

-- ═══════════════════════════════════════
-- 3. fuel_status — สถานะน้ำมัน (report)
-- ═══════════════════════════════════════
create table fuel_status (
  id bigint generated always as identity primary key,
  station_id bigint not null references stations(id) on delete cascade,
  fuel_type text not null,
  status text not null check (status in ('available','queue','out')),
  queue_level text default 'none' check (queue_level in ('none','low','medium','high')),
  reported_by_role text not null default 'anonymous',
  reported_by_user bigint references station_staff(id),
  ip_hash text,
  votes_confirm int default 0,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '30 minutes')
);

create index fuel_status_station_idx on fuel_status (station_id, fuel_type, created_at desc);
create index fuel_status_active_idx on fuel_status (station_id)
  where expires_at > now();  -- partial index: เฉพาะที่ยังไม่หมดอายุ

-- ═══════════════════════════════════════
-- 4. station_limits — ขีดจำกัดการเติม
-- ═══════════════════════════════════════
create table station_limits (
  id bigint generated always as identity primary key,
  station_id bigint not null references stations(id) on delete cascade,
  fuel_type text,              -- NULL = ทุกชนิด
  limit_type text not null check (limit_type in ('liters','baht')),
  limit_amount int not null,
  reported_by_role text not null default 'anonymous',
  reported_by_user bigint references station_staff(id),
  ip_hash text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index station_limits_station_idx on station_limits (station_id)
  where is_active = true;

-- ═══════════════════════════════════════
-- 5. station_staff — เจ้าของ/พนักงานปั๊ม
-- ═══════════════════════════════════════
create table station_staff (
  id bigint generated always as identity primary key,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  station_id bigint not null references stations(id) on delete cascade,
  role text not null check (role in ('owner','staff')),
  display_name text,
  verified boolean default false,
  created_at timestamptz default now(),
  unique(auth_user_id, station_id)
);

create index station_staff_user_idx on station_staff (auth_user_id);
create index station_staff_station_idx on station_staff (station_id);

-- ═══════════════════════════════════════
-- 6. comments — ความคิดเห็น (anonymous)
-- ═══════════════════════════════════════
create table comments (
  id bigint generated always as identity primary key,
  station_id bigint not null references stations(id) on delete cascade,
  message text not null check (length(message) <= 300),
  ip_hash text,
  created_at timestamptz default now()
);

create index comments_station_idx on comments (station_id, created_at desc);

-- ═══════════════════════════════════════
-- 7. pending_stations — คำขอเพิ่มปั๊ม
-- ═══════════════════════════════════════
create table pending_stations (
  id bigint generated always as identity primary key,
  name text not null,
  brand text,
  lat double precision not null,
  lng double precision not null,
  place_id_found text,
  maps_verified boolean default false,
  ip_hash text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_at timestamptz,
  note text,
  created_at timestamptz default now()
);

create index pending_stations_status_idx on pending_stations (status)
  where status = 'pending';

-- ═══════════════════════════════════════
-- 8. removal_requests — คำขอลบปั๊ม
-- ═══════════════════════════════════════
create table removal_requests (
  id bigint generated always as identity primary key,
  station_id bigint not null references stations(id) on delete cascade,
  reason text not null,
  ip_hash text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now()
);

create index removal_requests_status_idx on removal_requests (status)
  where status = 'pending';
```

### RLS Policies (ตาม security-rls-basics + security-rls-performance)

```sql
-- stations: ทุกคนอ่านได้, เจ้าของปั๊มแก้ไขได้
alter table stations enable row level security;
create policy "Anyone can read active stations" on stations
  for select using (status = 'active');
create policy "Staff can update own station" on stations
  for update using (
    exists (
      select 1 from station_staff
      where station_id = stations.id
        and auth_user_id = (select auth.uid())
        and verified = true
    )
  );

-- fuel_status: ทุกคนอ่านได้ + เขียนได้ (anonymous report)
alter table fuel_status enable row level security;
create policy "Anyone can read" on fuel_status for select using (true);
create policy "Anyone can insert" on fuel_status for insert with check (true);

-- fuel_prices: ทุกคนอ่านได้ + เขียนได้
alter table fuel_prices enable row level security;
create policy "Anyone can read" on fuel_prices for select using (true);
create policy "Anyone can insert" on fuel_prices for insert with check (true);

-- station_limits: ทุกคนอ่านได้ + เขียนได้, เจ้าของ update ได้
alter table station_limits enable row level security;
create policy "Anyone can read active" on station_limits
  for select using (is_active = true);
create policy "Anyone can insert" on station_limits
  for insert with check (true);
create policy "Staff can update own station limits" on station_limits
  for update using (
    exists (
      select 1 from station_staff
      where station_id = station_limits.station_id
        and auth_user_id = (select auth.uid())
        and verified = true
    )
  );

-- station_staff: เจ้าของเห็นเฉพาะของตัวเอง
alter table station_staff enable row level security;
create policy "Users see own records" on station_staff
  for select using (auth_user_id = (select auth.uid()));
create policy "Users can insert own" on station_staff
  for insert with check (auth_user_id = (select auth.uid()));

-- comments: ทุกคนอ่าน+เขียนได้
alter table comments enable row level security;
create policy "Anyone can read" on comments for select using (true);
create policy "Anyone can insert" on comments for insert with check (true);

-- pending_stations, removal_requests: ทุกคนเขียนได้, admin อ่านได้
-- (admin check ผ่าน service_role key ใน API route)
```

### DB Function: Radar Query

```sql
-- ดึงปั๊มในรัศมี พร้อมข้อมูลทั้งหมดในครั้งเดียว (ลด N+1)
create or replace function get_nearby_stations(
  user_lat double precision,
  user_lng double precision,
  radius_m int default 20000,
  max_results int default 50
)
returns table (
  id bigint,
  name text,
  brand text,
  lat double precision,
  lng double precision,
  address text,
  is_open boolean,
  open_hours jsonb,
  distance_m double precision,
  fuel_data jsonb,        -- [{fuel_type, status, queue_level, price, fill_limit, reported_by_role, reported_ago_min}]
  station_limit jsonb     -- [{fuel_type, limit_type, limit_amount}]
)
language sql stable
as $$
  select
    s.id,
    s.name,
    s.brand,
    st_y(s.location::geometry) as lat,
    st_x(s.location::geometry) as lng,
    s.address,
    s.is_open,
    s.open_hours,
    st_distance(s.location, st_makepoint(user_lng, user_lat)::geography) as distance_m,
    -- Fuel data: status + price + limit รวมกัน
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'fuel_type', fd.fuel_type,
        'status', fd.status,
        'queue_level', fd.queue_level,
        'price', fd.price,
        'fill_limit_type', fd.fill_limit_type,
        'fill_limit_amount', fd.fill_limit_amount,
        'reported_by_role', fd.reported_by_role,
        'reported_ago_min', extract(epoch from (now() - fd.created_at)) / 60,
        'votes_confirm', fd.votes_confirm
      ))
      from (
        select distinct on (fs.fuel_type)
          fs.fuel_type, fs.status, fs.queue_level,
          fs.reported_by_role, fs.created_at, fs.votes_confirm,
          fp_sub.price,
          sl_sub.limit_type as fill_limit_type,
          sl_sub.limit_amount as fill_limit_amount
        from fuel_status fs
        left join lateral (
          select price from fuel_prices
          where station_id = s.id and fuel_type = fs.fuel_type
          order by created_at desc limit 1
        ) fp_sub on true
        left join lateral (
          select limit_type, limit_amount from station_limits
          where station_id = s.id
            and (fuel_type = fs.fuel_type or fuel_type is null)
            and is_active = true
          order by fuel_type nulls last limit 1
        ) sl_sub on true
        where fs.station_id = s.id and fs.expires_at > now()
        order by fs.fuel_type, fs.created_at desc
      ) fd
    ), '[]'::jsonb) as fuel_data,
    -- Station-wide limits
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'fuel_type', sl.fuel_type,
        'limit_type', sl.limit_type,
        'limit_amount', sl.limit_amount
      ))
      from station_limits sl
      where sl.station_id = s.id and sl.is_active = true
    ), '[]'::jsonb) as station_limit
  from stations s
  where s.status = 'active'
    and st_dwithin(s.location, st_makepoint(user_lng, user_lat)::geography, radius_m)
  order by distance_m
  limit max_results;
$$;
```

---

## Next.js Project Structure (ตาม React Best Practices)

```
fuel-app/
├── src/
│   ├── app/                          # App Router
│   │   ├── layout.tsx                # Root layout (font, theme provider)
│   │   ├── page.tsx                  # หน้าหลัก (map + station list)
│   │   ├── station/
│   │   │   └── [id]/
│   │   │       └── page.tsx          # รายละเอียดปั๊ม
│   │   ├── staff/                    # เจ้าของ/พนักงานปั๊ม
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── dashboard/
│   │   │       ├── layout.tsx
│   │   │       └── page.tsx          # จัดการสถานะปั๊ม
│   │   ├── admin/                    # Admin panel
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── api/                      # API Routes
│   │       ├── stations/
│   │       │   ├── nearby/route.ts   # GET: radar query
│   │       │   └── [id]/route.ts     # GET: station detail
│   │       ├── reports/
│   │       │   ├── route.ts          # POST: submit report
│   │       │   └── confirm/route.ts  # POST: vote confirm
│   │       ├── prices/route.ts       # POST: submit price
│   │       ├── limits/route.ts       # POST: submit fill limit
│   │       ├── comments/route.ts     # GET/POST
│   │       ├── pending/route.ts      # GET/POST/PATCH
│   │       └── removal/route.ts      # GET/POST/PATCH
│   │
│   ├── components/
│   │   ├── map/
│   │   │   ├── RadarMap.tsx          # Leaflet map + radar circle (dynamic import, ssr:false)
│   │   │   ├── StationMarker.tsx     # แต่ละ pin บน map
│   │   │   ├── UserLocationMarker.tsx
│   │   │   └── RadarSlider.tsx       # ปรับรัศมีเรดาร์
│   │   ├── station/
│   │   │   ├── StationCard.tsx       # Card ในรายการ
│   │   │   ├── StationDetail.tsx     # รายละเอียดเต็ม
│   │   │   ├── FuelBadge.tsx         # สถานะน้ำมัน (สี + icon)
│   │   │   ├── PriceBadge.tsx        # ราคา
│   │   │   ├── LimitBadge.tsx        # ขีดจำกัดเติม
│   │   │   ├── QueueBadge.tsx        # สถานะคิว
│   │   │   └── OpenStatusBadge.tsx   # เปิด/ปิด
│   │   ├── report/
│   │   │   ├── ReportModal.tsx       # Modal รายงานสถานะ
│   │   │   ├── PriceReportForm.tsx   # ฟอร์มรายงานราคา
│   │   │   ├── LimitReportForm.tsx   # ฟอร์มรายงานขีดจำกัด
│   │   │   └── FuelSelector.tsx      # เลือกชนิดน้ำมัน
│   │   ├── staff/
│   │   │   ├── StaffDashboard.tsx    # Dashboard เจ้าของปั๊ม
│   │   │   ├── QuickUpdatePanel.tsx  # อัปเดตสถานะด่วน
│   │   │   └── PriceUpdateForm.tsx   # อัปเดตราคา
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── PendingList.tsx
│   │   │   ├── RemovalList.tsx
│   │   │   └── CommentModeration.tsx
│   │   └── ui/
│   │       ├── Modal.tsx
│   │       ├── Toast.tsx
│   │       ├── Skeleton.tsx
│   │       ├── ThemeToggle.tsx
│   │       └── FilterChips.tsx
│   │
│   ├── hooks/
│   │   ├── useNearbyStations.ts      # SWR: ดึงปั๊มใกล้เคียง (ตาม client-swr-dedup)
│   │   ├── useStationDetail.ts       # SWR: รายละเอียดปั๊ม
│   │   ├── useGeolocation.ts         # GPS location
│   │   ├── useRadar.ts              # รัศมี + center state
│   │   ├── useBookmarks.ts          # localStorage bookmarks (ตาม client-localstorage-schema)
│   │   └── useRealtimeStatus.ts     # Supabase Realtime subscription
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser client
│   │   │   ├── server.ts            # Server client (API routes)
│   │   │   └── types.ts             # Generated types
│   │   ├── constants.ts             # Fuel types, brands, provinces
│   │   ├── rate-limit.ts            # IP-based rate limiting
│   │   └── utils.ts                 # Helpers
│   │
│   └── styles/
│       └── globals.css              # Tailwind + CSS variables (theme)
│
├── supabase/
│   └── migrations/
│       ├── 001_extensions.sql        # PostGIS, pg_cron
│       ├── 002_tables.sql            # All tables
│       ├── 003_indexes.sql           # All indexes
│       ├── 004_rls.sql               # RLS policies
│       ├── 005_functions.sql         # get_nearby_stations()
│       └── 006_seed.sql              # Initial data (provinces)
│
├── scripts/
│   └── seed-stations.ts              # One-time: Places API → Supabase
│
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## React Best Practices ที่ใช้

### 1. Eliminating Waterfalls (CRITICAL)
- **async-suspense-boundaries**: Map + StationList ใช้ Suspense แยกกัน → map โหลดก่อน, list stream ตามมา
- **async-parallel**: Station detail page fetch station + comments + reports พร้อมกัน via `Promise.all()`
- **server-parallel-fetching**: Admin dashboard ใช้ parallel RSC composition

### 2. Bundle Size (CRITICAL)
- **bundle-dynamic-imports**: `RadarMap` ใช้ `next/dynamic` ssr:false (Leaflet ไม่รองรับ SSR)
- **bundle-defer-third-party**: Supabase Realtime subscription โหลดหลัง hydration

### 3. Client Data Fetching (MEDIUM-HIGH)
- **client-swr-dedup**: ทุก client fetch ใช้ SWR → auto dedupe, cache, revalidate
- **client-localstorage-schema**: Bookmarks ใช้ versioned localStorage schema

### 4. Re-render Optimization (MEDIUM)
- **rerender-memo**: StationCard ใช้ React.memo (list อาจมี 50+ items)
- **rerender-derived-state**: RadarSlider ใช้ derived state (ไม่ใช้ useEffect sync)
- **rerender-use-ref-transient-values**: Map pan/zoom ใช้ ref ไม่ trigger re-render

---

## Supabase Best Practices ที่ใช้

| Rule | การนำไปใช้ |
|------|-----------|
| schema-primary-keys | `bigint identity` ทุกตาราง |
| schema-data-types | `text`, `timestamptz`, `numeric(6,2)`, `boolean` |
| schema-foreign-key-indexes | ทุก FK มี index |
| query-missing-indexes | ทุก WHERE/JOIN column มี index |
| query-partial-indexes | `where status = 'active'`, `where is_active = true` |
| security-rls-basics | ทุกตาราง enable RLS |
| security-rls-performance | ใช้ `(select auth.uid())` wrapped in subquery |
| data-pagination | Comments ใช้ cursor-based pagination |
| data-n-plus-one | `get_nearby_stations()` ดึงทุกอย่างใน 1 query |

---

## Phases การทำงาน

### Phase 1: Foundation
1. Init Next.js 15 project + Tailwind + TypeScript
2. Setup Supabase project + PostGIS extension
3. สร้างทุก migration files (tables, indexes, RLS, functions)
4. สร้าง seed script ดึงปั๊มจาก Places API ครั้งเดียว
5. สร้าง Supabase client (browser + server)
6. Generate TypeScript types จาก Supabase

### Phase 2: Map + Radar + Station List (หน้าหลัก)
1. `RadarMap` component (Leaflet, dynamic import ssr:false)
2. `useGeolocation` hook + `useRadar` hook (radius state)
3. `RadarSlider` component (ปรับ 5-50 กม.)
4. API route `GET /api/stations/nearby` → เรียก `get_nearby_stations()`
5. `useNearbyStations` (SWR hook)
6. `StationCard` + `FuelBadge` + `PriceBadge` + `QueueBadge` + `LimitBadge` + `OpenStatusBadge`
7. `StationMarker` บน map + คลิกดู detail
8. Filter chips (ชนิดน้ำมัน)
9. Theme toggle (light/dark)
10. Bookmark system (localStorage)

### Phase 3: Report System
1. `ReportModal` — multi-step: เลือกน้ำมัน → ตั้งสถานะ + คิว
2. `PriceReportForm` — รายงานราคาขายจริง
3. `LimitReportForm` — รายงานขีดจำกัดเติม (ลิตร/บาท, ทุกชนิดหรือเฉพาะบาง)
4. API routes: POST reports, prices, limits
5. Vote confirm (ยืนยัน report)
6. Rate limiting (IP-based)

### Phase 4: เจ้าของ/พนักงานปั๊ม
1. Supabase Auth setup (Email login)
2. Register flow: สมัคร → เลือกปั๊ม → รอ admin verify
3. Staff dashboard: อัปเดตสถานะ + ราคา + ขีดจำกัด + เปิด/ปิด
4. Supabase Realtime: เจ้าของอัปเดต → user เห็นทันที
5. Badge "อัปเดตโดยเจ้าของปั๊ม" (น่าเชื่อถือกว่า anonymous)

### Phase 5: Admin Panel
1. Admin auth (password-based หรือ Supabase role)
2. Dashboard: สถิติ, brand breakdown
3. Pending stations: approve/reject → เพิ่มเข้า stations
4. Removal requests: approve → soft delete
5. Comment moderation: ลบ comment
6. Staff verification: verify เจ้าของปั๊ม

### Phase 6: Polish + Deploy
1. Responsive final pass
2. SEO meta tags
3. PWA manifest (installable)
4. Vercel deploy + Supabase production
5. Environment variables setup
6. Supabase cron: cleanup expired reports ทุกชั่วโมง

---

## Free Tier Limits (ข้อจำกัดแผนฟรี)

### Vercel Free
- 100 GB bandwidth/เดือน
- Serverless functions: 100 GB-hours
- ✅ เพียงพอสำหรับ 10,000+ users/วัน

### Supabase Free
- Database: 500 MB
- Auth: 50,000 MAU
- Realtime: 200 concurrent connections
- Edge Functions: 500,000 invocations
- ✅ เพียงพอ ถ้าปั๊ม < 5,000 แห่ง + users < 50,000/เดือน

### เทียบกับ GAS เดิม
| | GAS เดิม | Vercel + Supabase Free |
|---|---|---|
| Concurrent users | ~30 | ~200 (Realtime) / ไม่จำกัด (API) |
| Response time | 2-5 วินาที | < 200ms |
| Data size | Sheet limit ~10MB | 500 MB |
| Daily API calls | ~20,000 | ไม่จำกัด (Vercel) |
| Places API | ทุกวัน ($$) | ครั้งเดียว (ฟรี tier) |
