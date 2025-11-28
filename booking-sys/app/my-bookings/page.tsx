// app/my-bookings/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import NavBar from "@/src/components/navBar";
import getBrowserSupabase from "@/src/lib/supabase";
import ConfirmationModal from "@/src/components/confirmationModal";

type BookingRow = {
  booking_id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  role: string;
};

export default function MyBookingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<BookingRow | null>(
    null
  );
  const [modalBusy, setModalBusy] = useState(false);

  // 1) Find nuværende bruger
  useEffect(() => {
    const loadUser = async () => {
      const supabase = getBrowserSupabase();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
      } else {
        setUserId(null);
      }
    };

    loadUser().catch((err) => {
      console.error("Kunne ikke hente bruger:", err);
      setUserId(null);
    });
  }, []);

  // 2) Hent alle bookinger for den bruger
  useEffect(() => {
    if (!userId) return;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = getBrowserSupabase();
        const { data, error } = await supabase
          .from("booking")
          .select("booking_id, title, starts_at, ends_at, role")
          .eq("owner", userId)
          .order("starts_at", { ascending: true });

        if (error) {
          console.error("Error fetching bookings:", error);
          setError("Kunne ikke hente dine bookinger.");
        } else {
          setBookings((data ?? []) as BookingRow[]);
        }
      } catch (err) {
        console.error("Uventet fejl ved hentning af bookinger:", err);
        setError("Der opstod en uventet fejl.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [userId]);

  // 3) Åbn modal for at bekræfte annullering
  const openCancelModal = (booking: BookingRow) => {
    setBookingToCancel(booking);
    setModalOpen(true);
  };

  // 4) Når bruger bekræfter annullering
  const handleConfirmCancel = async () => {
    if (!bookingToCancel || !userId) {
      setModalOpen(false);
      setBookingToCancel(null);
      return;
    }

    try {
      setModalBusy(true);
      const supabase = getBrowserSupabase();

      const { error } = await supabase
        .from("booking")
        .update({
          role: "available",
          owner: null,
        })
        .eq("booking_id", bookingToCancel.booking_id)
        .eq("owner", userId); // 🔐 sikkerhed: kun din egen booking

      if (error) {
        console.error("Error cancelling booking:", error);
        setError("Det var ikke muligt at annullere bookingen. Prøv igen.");
      } else {
        // fjern den annullerede booking fra UI
        setBookings((prev) =>
          prev.filter((b) => b.booking_id !== bookingToCancel.booking_id)
        );
      }
    } catch (err) {
      console.error("Uventet fejl ved annullering:", err);
      setError("Der skete en fejl under annulleringen.");
    } finally {
      setModalBusy(false);
      setModalOpen(false);
      setBookingToCancel(null);
    }
  };

  return (
    <>
      <div className="flex min-h-screen">
        <NavBar />

        <div className="flex-1 bg-gray-50 py-8 px-4">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-6 text-3xl font-bold">Mine bookinger</h1>

            {loading && (
              <p className="text-gray-600">Indlæser dine bookinger...</p>
            )}

            {error && (
              <p className="mb-4 text-sm text-red-600">
                {error}
              </p>
            )}

            {!loading && !error && bookings.length === 0 && (
              <p className="text-gray-500">Du har ingen bookinger.</p>
            )}

            {!loading && bookings.length > 0 && (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.booking_id}
                    className="flex items-center justify-between rounded-lg bg-white p-4 shadow"
                  >
                    <div>
                      <h3 className="text-lg font-semibold">
                        {booking.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Start:{" "}
                        {new Date(
                          booking.starts_at
                        ).toLocaleString("da-DK")}
                      </p>
                      <p className="text-sm text-gray-600">
                        Slut:{" "}
                        {booking.ends_at
                          ? new Date(
                              booking.ends_at
                            ).toLocaleString("da-DK")
                          : "Ikke angivet"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => openCancelModal(booking)}
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Annuller booking
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={modalOpen}
        title="Annuller booking"
        message={
          bookingToCancel
            ? `Er du sikker på, at du vil annullere bookingen "${bookingToCancel.title}"?`
            : "Er du sikker på, at du vil annullere denne booking?"
        }
        confirmLabel={modalBusy ? "Annullerer..." : "Ja, annuller"}
        cancelLabel="Fortryd"
        confirmColor="red"
        onConfirm={modalBusy ? () => {} : handleConfirmCancel}
        onClose={() => {
          if (modalBusy) return;
          setModalOpen(false);
          setBookingToCancel(null);
        }}
      />
    </>
  );
}
