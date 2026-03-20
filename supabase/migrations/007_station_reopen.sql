-- Station reopen schedule (when closed station will reopen)
create table station_reopen (
  id bigint generated always as identity primary key,
  station_id bigint not null references stations(id) on delete cascade,
  reopen_date date not null,
  reopen_time_slot text not null default 'unknown'
    check (reopen_time_slot in ('morning', 'afternoon', 'exact', 'unknown')),
  reopen_time time,
  note text,
  reported_by_role text not null default 'anonymous'
    check (reported_by_role in ('anonymous', 'owner', 'staff')),
  ip_hash text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create index station_reopen_station_idx on station_reopen(station_id, expires_at);

alter table station_reopen enable row level security;

create policy "Anyone can read reopen" on station_reopen
  for select using (true);

create policy "Anyone can insert reopen" on station_reopen
  for insert with check (true);
