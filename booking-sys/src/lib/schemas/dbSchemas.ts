// src/lib/schemas/dbSchemas.ts
import { z } from "zod";

/**
 * Roller for booking-rækken i DB:
 * - "available"     → slot er ledigt
 * - "not_available" → slot er booket
 */
export const roleEnum = z.enum(["available", "not_available"]);

/**
 * Payload når vi OPRETTER / GEMMER en booking-række.
 * Felter matcher booking-tabellen:
 *
 *  - title        (text)
 *  - starts_at    (timestamptz → string ISO)
 *  - ends_at      (timestamptz → string ISO eller null)
 *  - role         ("available" | "not_available")
 *  - facility_id  (uuid)
 *  - owner        (uuid eller null)
 */
export const bookingCreateSchema = z.object({
  title: z.string().min(1, "Titel er påkrævet"),
  starts_at: z.string().min(1, "Starttid er påkrævet"),
  ends_at: z.string().nullable().optional(),
  role: roleEnum.default("available"),
  facility_id: z
    .string()
    .uuid({ message: "Ugyldigt lokale-id (facility_id skal være en UUID)" }),
  owner: z.string().uuid().nullable().optional(),
});

/**
 * Partial version til PATCH/UPDATE.
 */
export const bookingUpdateSchema = bookingCreateSchema.partial();

/**
 * Booking sådan som den kommer tilbage fra DB.
 * Matcher dine rækker:
 *
 *  - booking_id   (uuid primary key)
 *  - created_at   (timestamptz)
 *  - plus alle felter fra bookingCreateSchema
 */
export const bookingResponseSchema = bookingCreateSchema.extend({
  booking_id: z
    .string()
    .uuid({ message: "Ugyldigt booking-id (booking_id skal være en UUID)" }),
  created_at: z.string().optional(),
});

/**
 * Facility-schema der matcher din facility-tabel:
 *
 *  - facility_id   uuid
 *  - title         text
 *  - capacity      varchar(50) / text (ofte "2-4 pers" osv.)
 *  - description   text
 *  - floor         text (fx "3")
 *  - facility_type text (fx "undervisning", "open learning")
 */
export const facilitySchema = z.object({
  facility_id: z.string().uuid(),
  title: z.string(),
  capacity: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  floor: z.string().nullable().optional(),
  facility_type: z.string().nullable().optional(),
});

/**
 * Brugerschema – brugt hvis du vil validere data fra userlist/auth.users.
 * Matcher typisk:
 *
 *  - id         uuid
 *  - email      text
 *  - full_name  text (valgfri)
 */
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().nullable().optional(),
});

// Type helpers
export type BookingCreate = z.infer<typeof bookingCreateSchema>;
export type BookingUpdate = z.infer<typeof bookingUpdateSchema>;
export type BookingResponse = z.infer<typeof bookingResponseSchema>;
export type Facility = z.infer<typeof facilitySchema>;
export type User = z.infer<typeof userSchema>;
