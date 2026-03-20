import { z } from 'zod'

export const reportSchema = z.object({
  station_id: z.number().int().positive(),
  fuel_type: z.string().min(1),
  status: z.enum(['available', 'queue', 'out']),
  queue_level: z.enum(['none', 'low', 'medium', 'high']).default('none'),
})

export const priceSchema = z.object({
  station_id: z.number().int().positive(),
  fuel_type: z.string().min(1),
  price: z.number().positive().max(999.99),
})

export const limitSchema = z.object({
  station_id: z.number().int().positive(),
  fuel_type: z.string().nullable().default(null),
  limit_type: z.enum(['liters', 'baht']),
  limit_amount: z.number().int().positive().max(100000),
})

export const commentSchema = z.object({
  station_id: z.number().int().positive(),
  message: z.string().min(1).max(300),
})

export const pendingStationSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().nullable().default(null),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  place_id_found: z.string().nullable().default(null),
  maps_verified: z.boolean().default(false),
})

export const removalSchema = z.object({
  station_id: z.number().int().positive(),
  reason: z.string().min(1).max(500),
})

export const deliverySchema = z.object({
  station_id: z.number().int().positive(),
  fuel_type: z.string().nullable().default(null),
  delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  delivery_time_slot: z.enum(['morning', 'afternoon', 'exact', 'unknown']),
  delivery_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().default(null),
})

export const reopenSchema = z.object({
  station_id: z.number().int().positive(),
  reopen_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reopen_time_slot: z.enum(['morning', 'afternoon', 'exact', 'unknown']),
  reopen_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().default(null),
  note: z.string().max(200).nullable().default(null),
})
