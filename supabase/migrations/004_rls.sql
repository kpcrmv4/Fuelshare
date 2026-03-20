-- ═══════════════════════════════════════
-- stations
-- ═══════════════════════════════════════
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

-- ═══════════════════════════════════════
-- station_staff
-- ═══════════════════════════════════════
alter table station_staff enable row level security;

create policy "Users see own records" on station_staff
  for select using (auth_user_id = (select auth.uid()));

create policy "Users can insert own" on station_staff
  for insert with check (auth_user_id = (select auth.uid()));

-- ═══════════════════════════════════════
-- fuel_prices
-- ═══════════════════════════════════════
alter table fuel_prices enable row level security;

create policy "Anyone can read prices" on fuel_prices
  for select using (true);

create policy "Anyone can insert prices" on fuel_prices
  for insert with check (true);

-- ═══════════════════════════════════════
-- fuel_status
-- ═══════════════════════════════════════
alter table fuel_status enable row level security;

create policy "Anyone can read status" on fuel_status
  for select using (true);

create policy "Anyone can insert status" on fuel_status
  for insert with check (true);

-- ═══════════════════════════════════════
-- station_limits
-- ═══════════════════════════════════════
alter table station_limits enable row level security;

create policy "Anyone can read active limits" on station_limits
  for select using (is_active = true);

create policy "Anyone can insert limits" on station_limits
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

-- ═══════════════════════════════════════
-- comments
-- ═══════════════════════════════════════
alter table comments enable row level security;

create policy "Anyone can read comments" on comments
  for select using (true);

create policy "Anyone can insert comments" on comments
  for insert with check (true);

-- ═══════════════════════════════════════
-- pending_stations
-- ═══════════════════════════════════════
alter table pending_stations enable row level security;

create policy "Anyone can insert pending" on pending_stations
  for insert with check (true);

create policy "Anyone can read own pending" on pending_stations
  for select using (true);

-- ═══════════════════════════════════════
-- removal_requests
-- ═══════════════════════════════════════
alter table removal_requests enable row level security;

create policy "Anyone can insert removal" on removal_requests
  for insert with check (true);

create policy "Anyone can read removal" on removal_requests
  for select using (true);
