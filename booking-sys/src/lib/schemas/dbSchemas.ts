import { z } from 'zod';

// Zod schemas for bookings, facilities and users. Adjust fields to match your DB schema.

export const roleEnum = z.enum(["available", "not_available"]);

export const bookingCreateSchema = z.object({
  title: z.string().min(1, "Titel er påkrævet"),
  starts_at: z.string().min(1, "Starttid er påkrævet"),
  ends_at: z.string().optional().nullable(),
  role: roleEnum.optional().default("available"),
  facility_id: z.string().uuid().optional().nullable(),
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
