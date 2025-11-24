import { z } from 'zod';

// Zod schemas for bookings, facilities and users. Adjust fields to match your DB schema.

export const bookingCreateSchema = z.object({
  room_id: z.number(),
  user_id: z.string(),
  start_time: z.string(), // ISO date-time
  end_time: z.string(), // ISO date-time
  title: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const bookingUpdateSchema = bookingCreateSchema.partial();

export const bookingResponseSchema = bookingCreateSchema.extend({
  id: z.number(),
  created_at: z.string().optional(),
});

export const facilitySchema = z.object({
  id: z.number(),
  name: z.string(),
  capacity: z.number().optional(),
  location: z.string().optional(),
});

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  full_name: z.string().optional(),
});

export type BookingCreate = z.infer<typeof bookingCreateSchema>;
export type BookingUpdate = z.infer<typeof bookingUpdateSchema>;
export type BookingResponse = z.infer<typeof bookingResponseSchema>;
