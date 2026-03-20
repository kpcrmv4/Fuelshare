-- Next delivery schedule (when fuel truck arrives)
create table next_delivery (
  id bigint generated always as identity primary key,
  station_id bigint not null references stations(id) on delete cascade,
  fuel_type text, -- null = all fuels at this station
  delivery_date date not null,
  delivery_time_slot text not null default 'unknown'
    check (delivery_time_slot in ('morning', 'afternoon', 'exact', 'unknown')),
  delivery_time time, -- only when slot = 'exact'
  reported_by_role text not null default 'anonymous'
    check (reported_by_role in ('anonymous', 'owner', 'staff')),
  ip_hash text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 days')
);

create index next_delivery_station_idx on next_delivery(station_id, expires_at);

alter table next_delivery enable row level security;

create policy "Anyone can read delivery" on next_delivery
  for select using (true);

create policy "Anyone can insert delivery" on next_delivery
  for insert with check (true);
