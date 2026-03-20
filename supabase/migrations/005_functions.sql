-- ═══════════════════════════════════════
-- get_nearby_stations: Radar query
-- ดึงปั๊มในรัศมี พร้อมข้อมูลทั้งหมดใน 1 query
-- ═══════════════════════════════════════
create or replace function get_nearby_stations(
  user_lat double precision,
  user_lng double precision,
  radius_m int default 20000,
  max_results int default 50
)
returns jsonb
language sql stable
as $$
  select coalesce(jsonb_agg(row_data), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'brand', s.brand,
      'lat', st_y(s.location::geometry),
      'lng', st_x(s.location::geometry),
      'address', s.address,
      'is_open', s.is_open,
      'open_hours', s.open_hours,
      'distance_m', round(st_distance(s.location, st_makepoint(user_lng, user_lat)::geography)::numeric, 0),
      'fuel_data', coalesce((
        select jsonb_agg(jsonb_build_object(
          'fuel_type', fd.fuel_type,
          'status', fd.status,
          'queue_level', fd.queue_level,
          'price', fd.price,
          'fill_limit_type', fd.fill_limit_type,
          'fill_limit_amount', fd.fill_limit_amount,
          'reported_by_role', fd.reported_by_role,
          'reported_ago_min', round(extract(epoch from (now() - fd.created_at))::numeric / 60, 0),
          'votes_confirm', fd.votes_confirm,
          'status_id', fd.status_id
        ))
        from (
          select distinct on (fs.fuel_type)
            fs.id as status_id,
            fs.fuel_type, fs.status, fs.queue_level,
            fs.reported_by_role, fs.created_at, fs.votes_confirm,
            (select fp.price from fuel_prices fp
             where fp.station_id = s.id and fp.fuel_type = fs.fuel_type
             order by fp.created_at desc limit 1) as price,
            (select sl.limit_type from station_limits sl
             where sl.station_id = s.id
               and (sl.fuel_type = fs.fuel_type or sl.fuel_type is null)
               and sl.is_active = true
             order by sl.fuel_type nulls last limit 1) as fill_limit_type,
            (select sl.limit_amount from station_limits sl
             where sl.station_id = s.id
               and (sl.fuel_type = fs.fuel_type or sl.fuel_type is null)
               and sl.is_active = true
             order by sl.fuel_type nulls last limit 1) as fill_limit_amount
          from fuel_status fs
          where fs.station_id = s.id and fs.expires_at > now()
          order by fs.fuel_type, fs.created_at desc
        ) fd
      ), '[]'::jsonb),
      'station_limits', coalesce((
        select jsonb_agg(jsonb_build_object(
          'fuel_type', sl.fuel_type,
          'limit_type', sl.limit_type,
          'limit_amount', sl.limit_amount
        ))
        from station_limits sl
        where sl.station_id = s.id and sl.is_active = true
      ), '[]'::jsonb)
    ) as row_data
    from stations s
    where s.status = 'active'
      and st_dwithin(s.location, st_makepoint(user_lng, user_lat)::geography, radius_m)
    order by st_distance(s.location, st_makepoint(user_lng, user_lat)::geography)
    limit max_results
  ) sub;
$$;

-- ═══════════════════════════════════════
-- get_station_detail: รายละเอียดปั๊มเดียว
-- ═══════════════════════════════════════
create or replace function get_station_detail(
  p_station_id bigint,
  user_lat double precision default null,
  user_lng double precision default null
)
returns jsonb
language sql stable
as $$
  select jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'brand', s.brand,
    'lat', st_y(s.location::geometry),
    'lng', st_x(s.location::geometry),
    'address', s.address,
    'is_open', s.is_open,
    'open_hours', s.open_hours,
    'distance_m', case
      when user_lat is not null and user_lng is not null
      then round(st_distance(s.location, st_makepoint(user_lng, user_lat)::geography)::numeric, 0)
      else null
    end,
    'fuel_data', coalesce((
      select jsonb_agg(jsonb_build_object(
        'fuel_type', fd.fuel_type,
        'status', fd.status,
        'queue_level', fd.queue_level,
        'price', fd.price,
        'fill_limit_type', fd.fill_limit_type,
        'fill_limit_amount', fd.fill_limit_amount,
        'reported_by_role', fd.reported_by_role,
        'reported_ago_min', round(extract(epoch from (now() - fd.created_at))::numeric / 60, 0),
        'votes_confirm', fd.votes_confirm,
        'status_id', fd.status_id
      ))
      from (
        select distinct on (fs.fuel_type)
          fs.id as status_id,
          fs.fuel_type, fs.status, fs.queue_level,
          fs.reported_by_role, fs.created_at, fs.votes_confirm,
          (select fp.price from fuel_prices fp
           where fp.station_id = s.id and fp.fuel_type = fs.fuel_type
           order by fp.created_at desc limit 1) as price,
          (select sl.limit_type from station_limits sl
           where sl.station_id = s.id
             and (sl.fuel_type = fs.fuel_type or sl.fuel_type is null)
             and sl.is_active = true
           order by sl.fuel_type nulls last limit 1) as fill_limit_type,
          (select sl.limit_amount from station_limits sl
           where sl.station_id = s.id
             and (sl.fuel_type = fs.fuel_type or sl.fuel_type is null)
             and sl.is_active = true
           order by sl.fuel_type nulls last limit 1) as fill_limit_amount
        from fuel_status fs
        where fs.station_id = s.id and fs.expires_at > now()
        order by fs.fuel_type, fs.created_at desc
      ) fd
    ), '[]'::jsonb),
    'station_limits', coalesce((
      select jsonb_agg(jsonb_build_object(
        'fuel_type', sl.fuel_type,
        'limit_type', sl.limit_type,
        'limit_amount', sl.limit_amount
      ))
      from station_limits sl
      where sl.station_id = s.id and sl.is_active = true
    ), '[]'::jsonb)
  )
  from stations s
  where s.id = p_station_id and s.status = 'active';
$$;

-- ═══════════════════════════════════════
-- cleanup_expired_reports: ลบ reports หมดอายุ
-- ═══════════════════════════════════════
create or replace function cleanup_expired_reports()
returns int
language sql
as $$
  with deleted as (
    delete from fuel_status
    where expires_at < now() - interval '1 day'
    returning id
  )
  select count(*)::int from deleted;
$$;
