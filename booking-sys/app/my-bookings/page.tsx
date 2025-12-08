// src/app/my-bookings/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import getBrowserSupabase from "@/src/lib/supabase";
import ConfirmationModal from "@/src/components/confirmationModal";
import { cancelBooking } from "@/src/lib/bookingApi";
import { getErrorMessage } from "@/src/lib/errorMessages";
import BookingCard from "@/src/components/bookingCard";

type Booking = {
  booking_id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
};

// 🔹 Fælles helper, så vi formaterer dato/tid/lokale ens
function getBookingDisplayFields(booking: Booking) {
  // ISO-dato "YYYY-MM-DD" til BookingCard
  const dateIso = booking.starts_at.split("T")[0] ?? "";

  const extractHHMM = (iso: string) => {
    const timePart = iso.split("T")[1] ?? "";
    return timePart.slice(0, 5); // "HH:MM"
  };

  const startTime = extractHHMM(booking.starts_at);
  const endTime = booking.ends_at ? extractHHMM(booking.ends_at) : "";
  const timeRange = endTime ? `${startTime} - ${endTime}` : startTime;

  // Lokalenavn fra title før " – "
  let facilityName = booking.title;
  const titleMatch = booking.title.match(/^(.+?)\s*–/);
  if (titleMatch) {
    facilityName = titleMatch[1];
  }

  // Dato som "4. December"
  const startDate = new Date(booking.starts_at);
  let dateStr = startDate.toLocaleDateString("da-DK", {
    month: "long",
    day: "numeric",
    timeZone: "Europe/Copenhagen",
  });
  dateStr = dateStr.replace(
    /(\d+\.\s*)([a-z])/,
    (match, prefix, firstLetter) => prefix + firstLetter.toUpperCase()
  );

  return { dateIso, timeRange, facilityName, dateStr };
}

// 🔹 Tekst til modalens "kort-agtige" hierarki
function buildModalMessage(booking: Booking) {
  const { dateStr, timeRange, facilityName } = getBookingDisplayFields(booking);

  // Samme rækkefølge som BookingCard: dato → lokale → tid
  return `Dato: ${dateStr}\nLokale: ${facilityName}\nTid: ${timeRange}`;
}

export default function MyBookingsPage() {
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
      const supabase = getBrowserSupabase() as any;
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

        const supabase = getBrowserSupabase() as any;
        const nowISO = new Date().toISOString();

        const { data, error } = await supabase
          .from("booking")
          .select("*")
          .eq("owner", userId)
          .gte("ends_at", nowISO)
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

  // Når der klikkes på "Fortryd" knappen i BookingCard
  const handleCardAction = (bookingId: string) => {
    const booking = bookings.find((b) => b.booking_id === bookingId);
    if (booking) {
      openCancelModal(booking);
    }
  };

  // 3) Annuller/fortryd booking via bookingApi
  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;

    try {
      setCancelLoading(true);
      setError(null);

      const result = await cancelBooking(bookingToCancel.booking_id);

      if (!result.ok) {
        const msg = getErrorMessage(result.errorKey);
        setError(msg);
        return;
      }

      // Success → fjern booking fra UI
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold">Mine bookinger</h1>

        {loading && <p>Henter dine bookinger...</p>}
        {error && <p className="mb-4 text-red-600">{error}</p>}

        {!loading && !error && bookings.length === 0 && (
          <p className="text-gray-500">Du har ingen bookinger.</p>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => {
              const { dateIso, timeRange, facilityName } =
                getBookingDisplayFields(booking);

              return (
                <BookingCard
                  key={booking.booking_id}
                  bookingId={booking.booking_id}
                  roomName={facilityName}
                  date={dateIso}
                  time={timeRange}
                  actionLabel="Fortryd"
                  onBook={handleCardAction}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Modal til bekræftelse af fortrydelse */}
      <ConfirmationModal
        isOpen={bookingToCancel !== null}
        title="Fortryd booking?"
        message={bookingToCancel ? buildModalMessage(bookingToCancel) : ""}
        confirmLabel={cancelLoading ? "Fortryder..." : "Ja, fortryd"}
        cancelLabel="Nej, behold"
        confirmVariant="danger"
        onConfirm={cancelLoading ? undefined : handleConfirmCancel}
        onClose={handleCloseModal}
      />
    </div>
  );
}
