// src/lib/errorMessages.ts

export type ErrorKey =
  // Auth
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_EMAIL_ALREADY_REGISTERED"
  | "AUTH_UNSUPPORTED_EMAIL_DOMAIN"
  | "AUTH_NETWORK_ERROR"
  | "AUTH_UNKNOWN_ERROR"
  // Booking
  | "BOOKING_LOGIN_REQUIRED"
  | "BOOKING_ALREADY_TAKEN"
  | "BOOKING_MAX_HOURS_EXCEEDED"
  | "BOOKING_MULTI_ROOM_NOT_ALLOWED"
  | "BOOKING_STUDENT_CANNOT_OVERRIDE"
  | "BOOKING_TEACHER_CANNOT_OVERRIDE"
  | "BOOKING_OWNER_ROLE_MISSING"
  | "BOOKING_NOT_FOUND"
  | "BOOKING_UNKNOWN_ERROR"
  // Form / UI
  | "FORM_DATE_REQUIRED"
  // Generic
  | "GENERIC_UNKNOWN_ERROR";

// Samling af alle bruger-facing fejltekster
export const errorMessages: Record<ErrorKey, string> = {
  // Auth
  AUTH_INVALID_CREDENTIALS: "Email eller adgangskode er forkert.",
  AUTH_EMAIL_ALREADY_REGISTERED:
    "Der findes allerede en bruger med denne e-mail.",
  AUTH_UNSUPPORTED_EMAIL_DOMAIN:
    "Din e-mail skal være en skolens adresse (fx @stud.ek.dk eller @ek.dk).",
  AUTH_NETWORK_ERROR:
    "Vi kunne ikke forbinde til serveren. Tjek din internetforbindelse og prøv igen.",
  AUTH_UNKNOWN_ERROR: "Noget gik galt under login. Prøv igen.",

  // Booking
  BOOKING_LOGIN_REQUIRED:
    "Du skal være logget ind for at booke et lokale. Log ind og prøv igen.",
  BOOKING_ALREADY_TAKEN:
    "Tidsrummet kunne ikke bookes. Det kan være, at en anden lige har taget det.",
  BOOKING_MAX_HOURS_EXCEEDED:
    "Du kan ikke booke mere end 4 timer på samme dag.",
  BOOKING_MULTI_ROOM_NOT_ALLOWED:
    "Du kan kun booke ét lokale pr. dag.",
  BOOKING_STUDENT_CANNOT_OVERRIDE:
    "Studerende kan ikke overtage en eksisterende booking.",
  BOOKING_TEACHER_CANNOT_OVERRIDE:
    "Du kan ikke overtage en booking, der allerede er lavet af en anden lærer.",
  BOOKING_OWNER_ROLE_MISSING:
    "Der er et problem med din brugerrolle. Kontakt en underviser eller administrator.",
  BOOKING_NOT_FOUND:
    "Tidsrummet blev ikke fundet. Prøv at opdatere siden.",
  BOOKING_UNKNOWN_ERROR:
    "Der opstod en uventet fejl under booking. Prøv igen senere.",

  // Form / UI
  FORM_DATE_REQUIRED:
    "Vælg en dato, før du søger efter lokaler.",

  // Generic
  GENERIC_UNKNOWN_ERROR:
    "Der opstod en uventet fejl. Prøv igen senere.",
};

export function getErrorMessage(key: ErrorKey): string {
  return errorMessages[key] ?? errorMessages.GENERIC_UNKNOWN_ERROR;
}
