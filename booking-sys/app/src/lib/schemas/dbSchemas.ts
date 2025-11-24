// src/lib/schemas/dbSchemas.ts
import { z } from "zod";

/* 
  Schema for: public.userlist

  SQL:
  id          uuid primary key default gen_random_uuid(),
  role        text not null default 'student' check (role in ('student', 'teacher')),
  created_at  timestamptz not null default now()
*/

// Enum til rolle (kun de værdier databasen accepterer)
export const userRoleEnum = z.enum(["student", "teacher"]);

// Fuld række fra databasen (når du læser data)
export const userlistSchema = z.object({
  id: z.string().uuid(),           // uuid i Supabase → string().uuid() i Zod
  role: userRoleEnum,              // skal være 'student' eller 'teacher'
  created_at: z.string().datetime() // timestamptz → string som datetime
});

// Data når du OPRETTER en userlist-række (INSERT)
// id & created_at har default i databasen, så de er ikke krævede.
// role har default 'student', så den er også valgfri ved oprettelse.
export const userlistInsertSchema = z.object({
  id: z.string().uuid().optional(),   // database laver en hvis du ikke sender en
  role: userRoleEnum.optional()       // hvis du ikke sender, bliver det 'student'
  // created_at lader vi databasen sætte selv
});

export type Userlist = z.infer<typeof userlistSchema>;
export type UserlistInsert = z.infer<typeof userlistInsertSchema>;


/* 
  Schema for: public.facility

  SQL:
  facility_id     uuid primary key default gen_random_uuid(),
  title           text not null,
  capacity        varchar(50),
  description     text
*/

// Fuld facility-række
export const facilitySchema = z.object({
  facility_id: z.string().uuid(),  // primærnøgle
  title: z.string().min(1),        // NOT NULL → skal have mindst 1 tegn
  capacity: z.string().max(50).nullable().optional(), 
  // varchar(50) uden NOT NULL → kan være NULL eller tom → vi tillader optional + nullable

  description: z.string().nullable().optional()
  // text uden NOT NULL → kan være NULL, så vi tillader nullable
});

// Når du opretter en facility (INSERT)
// facility_id har default, så vi gør den valgfri.
export const facilityInsertSchema = z.object({
  facility_id: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required"),
  capacity: z.string().max(50).nullable().optional(),
  description: z.string().nullable().optional()
});

export type Facility = z.infer<typeof facilitySchema>;
export type FacilityInsert = z.infer<typeof facilityInsertSchema>;


/* 
  Schema for: public.booking

  SQL:
  booking_id    uuid primary key default gen_random_uuid(),
  title         text not null,
  role          text not null default 'available' check (role in ('available', 'not_available')),
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  owner         uuid not null references auth.users(id) on delete cascade
*/

// Enum til booking status (din 'role'-kolonne)
export const bookingRoleEnum = z.enum(["available", "not_available"]);

// Fuld booking-række
export const bookingSchema = z.object({
  booking_id: z.string().uuid(),      // primærnøgle
  title: z.string().min(1),           // NOT NULL → krævet
  role: bookingRoleEnum,              // 'available' eller 'not_available'
  starts_at: z.string().datetime(),   // NOT NULL timestamptz
  ends_at: z.string().datetime().nullable().optional(),
  // timestamptz uden NOT NULL → kan være NULL → vi tillader nullable/optional

  owner: z.string().uuid()            // FK til auth.users(id) → altid krævet
});

// Når du opretter en booking (INSERT)
// booking_id & role har defaults → ikke krævet at sende
export const bookingInsertSchema = z.object({
  booking_id: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required"),
  role: bookingRoleEnum.optional(),   // default 'available' hvis du ikke sender
  starts_at: z.string().datetime({
    message: "starts_at must be a valid datetime string"
  }),
  ends_at: z.string().datetime().nullable().optional(),
  owner: z.string().uuid({
    message: "owner must be a valid user id (uuid)"
  })
});

export type Booking = z.infer<typeof bookingSchema>;
export type BookingInsert = z.infer<typeof bookingInsertSchema>;
