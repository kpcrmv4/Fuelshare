# Fuel Station App — Progress Tracker

> อัปเดตล่าสุด: 2026-03-20

---

## สถานะรวม

| Phase | ชื่อ | สถานะ | ความคืบหน้า |
|-------|------|-------|------------|
| 1 | Foundation | 🔲 ยังไม่เริ่ม | 0% |
| 2 | Map + Radar + Station List | 🔲 ยังไม่เริ่ม | 0% |
| 3 | Report System | 🔲 ยังไม่เริ่ม | 0% |
| 4 | เจ้าของ/พนักงานปั๊ม | 🔲 ยังไม่เริ่ม | 0% |
| 5 | Admin Panel | 🔲 ยังไม่เริ่ม | 0% |
| 6 | Polish + Deploy | 🔲 ยังไม่เริ่ม | 0% |

**รวมทั้งหมด: 0%**

---

## Phase 1: Foundation

> เป้าหมาย: Init project + ฐานข้อมูลพร้อมใช้งาน + seed ข้อมูลปั๊ม

| # | Task | สถานะ | หมายเหตุ |
|---|------|-------|---------|
| 1.1 | Init Next.js 15 + TypeScript + Tailwind + pnpm | 🔲 | |
| 1.2 | Setup Supabase project + enable PostGIS extension | 🔲 | |
| 1.3 | Migration: 001_extensions.sql (PostGIS, pg_cron) | 🔲 | |
| 1.4 | Migration: 002_tables.sql (8 ตาราง) | 🔲 | |
| 1.5 | Migration: 003_indexes.sql (ทุก index) | 🔲 | |
| 1.6 | Migration: 004_rls.sql (RLS policies) | 🔲 | |
| 1.7 | Migration: 005_functions.sql (get_nearby_stations) | 🔲 | |
| 1.8 | Supabase client setup (browser + server + admin) | 🔲 | |
| 1.9 | Generate TypeScript types จาก Supabase | 🔲 | |
| 1.10 | สร้าง seed script (Places API → Supabase ครั้งเดียว) | 🔲 | |
| 1.11 | สร้าง constants.ts (fuel types, brands, provinces) | 🔲 | |
| 1.12 | Setup environment variables (.env.local) | 🔲 | |
| 1.13 | Root layout + font + theme provider | 🔲 | |
| 1.14 | Tailwind config + CSS variables (light/dark) | 🔲 | |

---

## Phase 2: Map + Radar + Station List (หน้าหลัก)

> เป้าหมาย: ผู้ใช้เปิดแอป → เห็น map + ปั๊มในรัศมี 20 กม.

| # | Task | สถานะ | หมายเหตุ |
|---|------|-------|---------|
| 2.1 | API route: GET /api/stations/nearby | 🔲 | เรียก RPC get_nearby_stations |
| 2.2 | API route: GET /api/stations/[id] | 🔲 | station detail + fuel data |
| 2.3 | useGeolocation hook | 🔲 | navigator.geolocation |
| 2.4 | useRadar hook (radius + center state) | 🔲 | default 20km |
| 2.5 | useNearbyStations (SWR hook) | 🔲 | auto-refetch เมื่อ radius/center เปลี่ยน |
| 2.6 | RadarMap component (Leaflet, dynamic import) | 🔲 | ssr: false |
| 2.7 | RadarSlider component (5-50 กม.) | 🔲 | debounce 500ms |
| 2.8 | Radar circle overlay บน map | 🔲 | |
| 2.9 | StationMarker component (DivIcon + status dot) | 🔲 | brand color |
| 2.10 | UserLocationMarker (blue dot + pulse) | 🔲 | |
| 2.11 | StationCard component | 🔲 | ระยะทาง + สถานะ + ราคา + ขีดจำกัด |
| 2.12 | FuelBadge component | 🔲 | สีตาม status |
| 2.13 | PriceBadge component | 🔲 | แสดงราคา ฿XX.XX |
| 2.14 | QueueBadge component | 🔲 | none/low/medium/high |
| 2.15 | LimitBadge component | 🔲 | จำกัด X ลิตร / X บาท |
| 2.16 | OpenStatusBadge component | 🔲 | เปิด/ปิด + เวลา |
| 2.17 | StationDetail component (modal/page) | 🔲 | ข้อมูลเต็ม |
| 2.18 | FilterChips (ชนิดน้ำมัน) | 🔲 | all/diesel/gasohol/benzene/gas |
| 2.19 | Search bar (ค้นหาชื่อปั๊ม) | 🔲 | |
| 2.20 | ThemeToggle (light/dark) | 🔲 | |
| 2.21 | useBookmarks hook (localStorage) | 🔲 | versioned schema |
| 2.22 | Bookmark toggle บน StationDetail | 🔲 | |
| 2.23 | Skeleton loading (map + list) | 🔲 | |
| 2.24 | Empty state (ไม่พบปั๊มในรัศมี) | 🔲 | |
| 2.25 | ปุ่ม "กลับตำแหน่งฉัน" | 🔲 | |
| 2.26 | ปุ่ม "ค้นหาในพื้นที่นี้" (เมื่อเลื่อน map) | 🔲 | |
| 2.27 | Responsive layout (mobile + desktop) | 🔲 | |

---

## Phase 3: Report System

> เป้าหมาย: ผู้ใช้รายงานสถานะ + ราคา + ขีดจำกัดเติมได้

| # | Task | สถานะ | หมายเหตุ |
|---|------|-------|---------|
| 3.1 | API route: POST /api/reports (สถานะน้ำมัน) | 🔲 | + rate limit |
| 3.2 | API route: POST /api/reports/confirm (vote) | 🔲 | |
| 3.3 | API route: POST /api/prices (ราคา) | 🔲 | + rate limit |
| 3.4 | API route: POST /api/limits (ขีดจำกัดเติม) | 🔲 | + rate limit |
| 3.5 | API route: GET/POST /api/comments | 🔲 | cursor pagination |
| 3.6 | Rate limiter utility (IP-based) | 🔲 | |
| 3.7 | Zod schemas สำหรับ validate input | 🔲 | |
| 3.8 | ReportModal — step 1: เลือกชนิดน้ำมัน | 🔲 | FuelSelector |
| 3.9 | ReportModal — step 2: ตั้งสถานะ (available/queue/out) | 🔲 | |
| 3.10 | ReportModal — step 3: ระดับคิว (ถ้า status=queue) | 🔲 | none/low/medium/high |
| 3.11 | PriceReportForm | 🔲 | ราคาต่อชนิดน้ำมัน |
| 3.12 | LimitReportForm | 🔲 | ลิตร/บาท + ทุกชนิดหรือเฉพาะบาง |
| 3.13 | Vote confirm button | 🔲 | + prevent double vote |
| 3.14 | Comment form + comment list | 🔲 | max 300 chars |
| 3.15 | Toast notification (สำเร็จ/ผิดพลาด) | 🔲 | |
| 3.16 | SWR mutate หลัง submit (update UI ทันที) | 🔲 | |
| 3.17 | Report for removal request | 🔲 | |

---

## Phase 4: เจ้าของ/พนักงานปั๊ม

> เป้าหมาย: เจ้าของปั๊ม login + อัปเดตข้อมูลแบบ realtime

| # | Task | สถานะ | หมายเหตุ |
|---|------|-------|---------|
| 4.1 | Supabase Auth setup (Email provider) | 🔲 | |
| 4.2 | Staff login page | 🔲 | email + password |
| 4.3 | Staff register page | 🔲 | สมัคร → เลือกปั๊ม → รอ verify |
| 4.4 | Auth middleware (protected routes) | 🔲 | |
| 4.5 | Staff dashboard layout | 🔲 | |
| 4.6 | QuickUpdatePanel — อัปเดตสถานะน้ำมันด่วน | 🔲 | toggle per fuel type |
| 4.7 | PriceUpdateForm — อัปเดตราคาทุกชนิด | 🔲 | |
| 4.8 | LimitUpdateForm — ตั้งขีดจำกัดเติม | 🔲 | ระดับปั๊ม + ระดับชนิดน้ำมัน |
| 4.9 | Station open/close toggle | 🔲 | is_open + open_hours |
| 4.10 | Supabase Realtime subscription | 🔲 | fuel_status changes |
| 4.11 | useRealtimeStatus hook | 🔲 | |
| 4.12 | Badge "อัปเดตโดยเจ้าของปั๊ม" | 🔲 | แสดงใน StationCard + Detail |
| 4.13 | Staff profile page | 🔲 | เปลี่ยนรหัสผ่าน |

---

## Phase 5: Admin Panel

> เป้าหมาย: Admin จัดการข้อมูลทั้งหมด + verify เจ้าของปั๊ม

| # | Task | สถานะ | หมายเหตุ |
|---|------|-------|---------|
| 5.1 | Admin auth (password-based) | 🔲 | |
| 5.2 | Admin dashboard — สถิติรวม | 🔲 | stations, reports, comments |
| 5.3 | Admin dashboard — brand breakdown | 🔲 | |
| 5.4 | API route: GET/PATCH /api/pending | 🔲 | |
| 5.5 | PendingList — approve/reject station requests | 🔲 | |
| 5.6 | API route: GET/PATCH /api/removal | 🔲 | |
| 5.7 | RemovalList — approve/reject removal requests | 🔲 | |
| 5.8 | CommentModeration — ลบ comment | 🔲 | |
| 5.9 | Staff verification — verify เจ้าของปั๊ม | 🔲 | |
| 5.10 | Tools — clear cache, manual actions | 🔲 | |

---

## Phase 6: Polish + Deploy

> เป้าหมาย: Production-ready

| # | Task | สถานะ | หมายเหตุ |
|---|------|-------|---------|
| 6.1 | Responsive final pass (ทุกหน้า) | 🔲 | |
| 6.2 | SEO meta tags + OG image | 🔲 | |
| 6.3 | PWA manifest (installable) | 🔲 | |
| 6.4 | Error boundaries | 🔲 | |
| 6.5 | 404 / error pages | 🔲 | |
| 6.6 | Loading performance audit | 🔲 | target: LCP < 2.5s |
| 6.7 | Supabase cron: cleanup expired reports | 🔲 | ทุกชั่วโมง |
| 6.8 | Vercel deploy + env vars | 🔲 | |
| 6.9 | Supabase production project | 🔲 | |
| 6.10 | Custom domain (ถ้ามี) | 🔲 | |
| 6.11 | Migrate ข้อมูลจาก Google Sheets → Supabase | 🔲 | one-time script |

---

## Blockers / Issues

| # | ปัญหา | สถานะ | แก้ไขอย่างไร |
|---|-------|-------|------------|
| — | ยังไม่มี | — | — |

---

## Decisions Log

| วันที่ | การตัดสินใจ | เหตุผล |
|--------|-----------|--------|
| 2026-03-20 | ใช้ Leaflet + OpenStreetMap (ไม่ใช่ Google Maps) | Frontend เดิมใช้ Leaflet อยู่แล้ว, ฟรี 100% |
| 2026-03-20 | Places API ใช้ครั้งเดียว seed เท่านั้น | ประหยัดค่าใช้จ่าย, ไม่ต้อง sync ทุกวัน |
| 2026-03-20 | Radar UI default 20 กม. | ลด data transfer, PostGIS filter ที่ DB |
| 2026-03-20 | เจ้าของปั๊ม login ด้วย Email | Supabase Auth ฟรี 50,000 MAU |
| 2026-03-20 | User ทั่วไปรายงานราคา + ขีดจำกัดได้ | Crowdsource ข้อมูลจากผู้ใช้จริง |
| 2026-03-20 | Anonymous review เหมือนเดิม | ไม่บังคับ login สำหรับผู้ใช้ทั่วไป |
| 2026-03-20 | bigint identity แทน UUID v4 | ตาม Supabase best practice, ลด index fragmentation |
| 2026-03-20 | SWR สำหรับ client fetching | Auto dedupe + cache + revalidate |

---

## Legend

| Icon | ความหมาย |
|------|---------|
| 🔲 | ยังไม่เริ่ม |
| 🔨 | กำลังทำ |
| ✅ | เสร็จแล้ว |
| ❌ | ยกเลิก/ข้าม |
| ⚠️ | มีปัญหา/blocked |
