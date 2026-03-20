-- ═══════════════════════════════════════
-- 1. stations
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
  open_hours jsonb,
  source text not null default 'google_maps',
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════
-- 2. station_staff (must be before fuel_prices/fuel_status for FK)
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

-- ═══════════════════════════════════════
-- 3. fuel_prices
-- ═══════════════════════════════════════
create table fuel_prices (
  id bigint generated always as identity primary key,
  station_id bigint not null references stations(id) on delete cascade,
  fuel_type text not null,
  price numeric(6,2) not null,
  reported_by_role text not null default 'anonymous',
  reported_by_user bigint references station_staff(id),
  ip_hash text,
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════
-- 4. fuel_status
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

-- ═══════════════════════════════════════
-- 5. station_limits
-- ═══════════════════════════════════════
create table station_limits (
  id bigint generated always as identity primary key,
  station_id bigint not null references stations(id) on delete cascade,
  fuel_type text,
  limit_type text not null check (limit_type in ('liters','baht')),
  limit_amount int not null,
  reported_by_role text not null default 'anonymous',
  reported_by_user bigint references station_staff(id),
  ip_hash text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════
-- 6. comments
-- ═══════════════════════════════════════
create table comments (
  id bigint generated always as identity primary key,
  station_id bigint not null references stations(id) on delete cascade,
  message text not null check (length(message) <= 300),
  ip_hash text,
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════
-- 7. pending_stations
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

-- ═══════════════════════════════════════
-- 8. removal_requests
-- ═══════════════════════════════════════
create table removal_requests (
  id bigint generated always as identity primary key,
  station_id bigint not null references stations(id) on delete cascade,
  reason text not null,
  ip_hash text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now()
);
