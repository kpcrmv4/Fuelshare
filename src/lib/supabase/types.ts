export interface NextDelivery {
  delivery_date: string
  delivery_time_slot: 'morning' | 'afternoon' | 'exact' | 'unknown'
  delivery_time: string | null
  fuel_type: string | null
  reported_by_role: 'anonymous' | 'owner' | 'staff'
}

export interface ReopenInfo {
  reopen_date: string
  reopen_time_slot: 'morning' | 'afternoon' | 'exact' | 'unknown'
  reopen_time: string | null
  note: string | null
  reported_by_role: 'anonymous' | 'owner' | 'staff'
}

export interface Station {
  id: number
  name: string
  brand: string
  lat: number
  lng: number
  address: string | null
  is_open: boolean
  open_hours: Record<string, string> | null
  distance_m: number | null
  fuel_data: FuelData[]
  station_limits: StationLimit[]
  next_delivery: NextDelivery | null
  reopen_info: ReopenInfo | null
}

export interface FuelData {
  fuel_type: string
  status: 'available' | 'queue' | 'out'
  queue_level: 'none' | 'low' | 'medium' | 'high'
  price: number | null
  fill_limit_type: 'liters' | 'baht' | null
  fill_limit_amount: number | null
  reported_by_role: 'anonymous' | 'owner' | 'staff'
  reported_ago_min: number
  votes_confirm: number
  status_id: number
}

export interface StationLimit {
  fuel_type: string | null
  limit_type: 'liters' | 'baht'
  limit_amount: number
}

export interface StationStaff {
  id: number
  auth_user_id: string
  station_id: number
  role: 'owner' | 'staff'
  display_name: string | null
  verified: boolean
  created_at: string
}

export interface Comment {
  id: number
  station_id: number
  message: string
  created_at: string
}

export interface PendingStation {
  id: number
  name: string
  brand: string | null
  lat: number
  lng: number
  place_id_found: string | null
  maps_verified: boolean
  ip_hash: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewed_at: string | null
  note: string | null
  created_at: string
}

export interface RemovalRequest {
  id: number
  station_id: number
  reason: string
  ip_hash: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}
