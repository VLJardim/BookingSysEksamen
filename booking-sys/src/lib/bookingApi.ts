// src/lib/bookingApi.ts
"use client";

import getBrowserSupabase from "@/src/lib/supabase";
import { mapBookingError } from "@/src/utils/errorMapping";
import type { ErrorKey } from "@/src/lib/errorMessages";

export type BookSlotResult =
  | { ok: true; wasAvailableBefore: boolean }
  | { ok: false; errorKey: ErrorKey };

export type CancelBookingResult =
  | { ok: true }
  | { ok: false; errorKey: ErrorKey };

// Book eller override et slot (bruges af både studerende og lærere)
export async function bookSlot(bookingId: string): Promise<BookSlotResult> {
  const supabase = getBrowserSupabase() as any;

  // 1) Tjek om bruger er logget ind
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, errorKey: "BOOKING_LOGIN_REQUIRED" };
  }

  // 2) Hent nuværende slot (for at se om det var ledigt før)
  const { data: existingData, error: fetchError } = await supabase
    .from("booking")
    .select("booking_id, role, owner")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (fetchError || !existingData) {
    console.error("[bookingApi.bookSlot] Failed to fetch slot", fetchError);
    return { ok: false, errorKey: "BOOKING_NOT_FOUND" };
  }

  const existing = existingData as {
    booking_id: string;
    role: "available" | "not_available";
    owner: string | null;
  };

  // 3) Forsøg at opdatere (DB + RLS + trigger håndhæver reglerne)
  const { data: updatedData, error: updateError } = await supabase
    .from("booking")
    .update({
      role: "not_available",
      owner: user.id,
    } as any)
    .eq("booking_id", bookingId)
    .select("*")
    .maybeSingle();

  if (updateError || !updatedData) {
    if (updateError) {
      const errorKey = mapBookingError(updateError);
      return { ok: false, errorKey };
    }

    return { ok: false, errorKey: "BOOKING_ALREADY_TAKEN" };
  }

  const wasAvailableBefore = existing.role === "available";
  return { ok: true, wasAvailableBefore };
}

// Annuller booking direkte via Supabase (samme idé som din nuværende kode)
export async function cancelBooking(
  bookingId: string
): Promise<CancelBookingResult> {
  const supabase = getBrowserSupabase() as any;

  // 1) Tjek at brugeren er logget ind
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, errorKey: "BOOKING_LOGIN_REQUIRED" };
  }

  // 2) Sæt tidsrummet tilbage til available og ryd owner (kun hvis du selv ejer det)
  const { data, error } = await supabase
    .from("booking")
    .update({
      role: "available",
      owner: null,
    } as any)
    .eq("booking_id", bookingId)
    .eq("owner", user.id)
    .select("booking_id")
    .maybeSingle();

  if (error) {
    console.error("[bookingApi.cancelBooking] Supabase error", error);
    const errorKey = mapBookingError(error);
    return { ok: false, errorKey };
  }

  if (!data) {
    // Ingen række matchede → enten ikke din booking eller den findes ikke
    return { ok: false, errorKey: "BOOKING_NOT_FOUND" };
  }

  return { ok: true };
}
