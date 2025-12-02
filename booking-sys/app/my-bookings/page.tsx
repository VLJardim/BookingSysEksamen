// src/app/my-bookings/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import getBrowserSupabase from "@/src/lib/supabase";
import ConfirmationModal from "@/src/components/confirmationModal";

type Booking = {
  booking_id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
};

export default function MyBookingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state for cancelling a booking
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // 1) Find current user id
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = getBrowserSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
      } else {
        setUserId(null);
      }
    };

    fetchUser().catch((err) => {
      console.error("Failed to load user", err);
      setUserId(null);
    });
  }, []);

  // 2) Hent brugerens bookinger
  useEffect(() => {
    if (!userId) return;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = getBrowserSupabase();
        const { data, error } = await supabase
          .from("booking")
          .select("*")
          .eq("owner", userId)
          .order("starts_at", { ascending: true });

        if (error) {
          console.error("Error fetching bookings:", error);
          setError("Kunne ikke hente dine bookinger.");
        } else {
          setBookings((data as Booking[]) || []);
        }
      } catch (err) {
        console.error("Unexpected error fetching bookings:", err);
        setError("Der opstod en fejl ved hentning af bookinger.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [userId]);

  const openCancelModal = (booking: Booking) => {
    setBookingToCancel(booking);
  };

  const handleCloseModal = () => {
    if (cancelLoading) return;
    setBookingToCancel(null);
  };

  // 3) Annuller booking direkte via Supabase (ikke længere via /api/bookings/:id)
  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;

    try {
      setCancelLoading(true);
      setError(null);

      const supabase = getBrowserSupabase();

      // 3.1: Tjek at brugeren er logget ind
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Du skal være logget ind for at annullere en booking.");
        return;
      }

      // 3.2: Sæt tidsrummet tilbage til available og ryd owner
      const { data, error } = await (supabase as any)
        .from("booking")
        .update({
          role: "available",
          owner: null,
        })
        .eq("booking_id", bookingToCancel.booking_id)
        .eq("owner", user.id) // sikkerhed: kun dine egne bookinger
        .select("booking_id")
        .maybeSingle();

      if (error || !data) {
        console.error("Cancel booking error", error);
        setError("Det lykkedes ikke at annullere bookingen.");
        return;
      }

      // 3.3: Success → fjern booking fra UI
      setBookings((prev) =>
        prev.filter((b) => b.booking_id !== bookingToCancel.booking_id)
      );
    } catch (err) {
      console.error("Unexpected cancel error", err);
      setError("Der opstod en uventet fejl ved annullering af bookingen.");
    } finally {
      setCancelLoading(false);
      setBookingToCancel(null);
    }
  };

  return (
    <div className="bg-gray-50 py-8 px-4 min-h-screen">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold">Mine bookinger</h1>

        {loading && <p>Henter dine bookinger...</p>}
        {error && <p className="mb-4 text-red-600">{error}</p>}

        {!loading && !error && bookings.length === 0 && (
          <p className="text-gray-500">Du har ingen bookinger.</p>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <div
                key={booking.booking_id}
                className="flex items-center justify-between rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow"
              >
                <div>
                  <h3 className="mb-2 text-xl font-semibold">
                    {booking.title}
                  </h3>
                  <p className="text-gray-600">
                    Start:{" "}
                    {new Date(booking.starts_at).toLocaleString("da-DK")}
                  </p>
                  <p className="text-gray-600">
                    Slut:{" "}
                    {booking.ends_at
                      ? new Date(booking.ends_at).toLocaleString("da-DK")
                      : "Ikke angivet"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/my-bookings/${booking.booking_id}`)
                    }
                    className="rounded-md bg-[#1864AB] px-4 py-2 text-sm font-medium text-white hover:bg-[#4E7CD9] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Rediger
                  </button>

                  <button
                    type="button"
                    onClick={() => openCancelModal(booking)}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Annuller booking
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal til bekræftelse af annullering */}
      <ConfirmationModal
        isOpen={bookingToCancel !== null}
        title="Annuller booking?"
        message={
          bookingToCancel
            ? `Er du sikker på, at du vil annullere bookingen af "${bookingToCancel.title}"?\n\nStart: ${new Date(
                bookingToCancel.starts_at
              ).toLocaleString("da-DK")}`
            : ""
        }
        confirmLabel={cancelLoading ? "Annullerer..." : "Ja, annuller"}
        cancelLabel="Behold booking"
        confirmVariant="danger"
        onConfirm={cancelLoading ? undefined : handleConfirmCancel}
        onClose={handleCloseModal}
      />
    </div>
  );
}
