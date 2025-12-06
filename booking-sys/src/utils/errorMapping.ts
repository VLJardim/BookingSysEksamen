// src/utils/errorMapping.ts
import { ErrorKey } from "@/src/lib/errorMessages";

// Map Supabase auth-fejl → ErrorKey
export function mapSupabaseAuthError(error: unknown): ErrorKey {
  const err = error as any;

  if (!err) {
    return "AUTH_UNKNOWN_ERROR";
  }

  const message: string = String(err.message ?? "");
  const lower = message.toLowerCase();
  const status: number | undefined =
    typeof err.status === "number" ? err.status : undefined;

  // Klassisk netværksfejl
  if (message === "Failed to fetch" || err.name === "TypeError") {
    return "AUTH_NETWORK_ERROR";
  }

  // Trigger fra din SQL: "Unsupported email domain for ..."
  if (lower.includes("unsupported email domain")) {
    return "AUTH_UNSUPPORTED_EMAIL_DOMAIN";
  }

  // Allerede registreret / eksisterende bruger
  if (
    lower.includes("already registered") ||
    lower.includes("already exists") ||
    lower.includes("user already")
  ) {
    return "AUTH_EMAIL_ALREADY_REGISTERED";
  }

  // Supabase standard: "Invalid login credentials" (typisk 400/401)
  if (
    lower.includes("invalid login credentials") ||
    status === 400 ||
    status === 401
  ) {
    return "AUTH_INVALID_CREDENTIALS";
  }

  return "AUTH_UNKNOWN_ERROR";
}

// Map booking-relaterede Postgres/Supabase-fejl → ErrorKey
export function mapBookingError(error: unknown): ErrorKey {
  const err = error as any;
  if (!err) {
    return "BOOKING_UNKNOWN_ERROR";
  }

  const message: string = String(err.message ?? "");
  const lower = message.toLowerCase();

  // Fra enforce_booking_rules()
  if (lower.includes("maximum number of bookings")) {
    return "BOOKING_MAX_HOURS_EXCEEDED";
  }

  if (lower.includes("cannot book multiple different rooms")) {
    return "BOOKING_MULTI_ROOM_NOT_ALLOWED";
  }

  if (lower.includes("students cannot override existing bookings")) {
    return "BOOKING_STUDENT_CANNOT_OVERRIDE";
  }

  if (lower.includes("teachers cannot override other teachers")) {
    return "BOOKING_TEACHER_CANNOT_OVERRIDE";
  }

  if (
    lower.includes("does not exist in userlist") ||
    lower.includes("missing user role")
  ) {
    return "BOOKING_OWNER_ROLE_MISSING";
  }

  // RLS/permission denied → vi tolker det som "allerede taget"
  if (
    lower.includes("violates row-level security policy") ||
    lower.includes("permission denied for table") ||
    lower.includes("row level security")
  ) {
    return "BOOKING_ALREADY_TAKEN";
  }

  return "BOOKING_UNKNOWN_ERROR";
}
