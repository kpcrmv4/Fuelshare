-- stations
create index stations_location_gist on stations using gist (location);
create index stations_province_active_idx on stations (province) where status = 'active';
create index stations_brand_active_idx on stations (brand) where status = 'active';
create index stations_place_id_idx on stations (place_id);

-- station_staff
create index station_staff_user_idx on station_staff (auth_user_id);
create index station_staff_station_idx on station_staff (station_id);

-- fuel_prices
create index fuel_prices_station_lookup_idx on fuel_prices (station_id, fuel_type, created_at desc);

-- fuel_status
create index fuel_status_station_lookup_idx on fuel_status (station_id, fuel_type, created_at desc);
create index fuel_status_expires_idx on fuel_status (station_id) where expires_at > now();

-- station_limits
create index station_limits_active_idx on station_limits (station_id) where is_active = true;

-- comments
create index comments_station_idx on comments (station_id, created_at desc);

-- pending_stations
create index pending_stations_pending_idx on pending_stations (status) where status = 'pending';

-- removal_requests
create index removal_requests_pending_idx on removal_requests (status) where status = 'pending';
