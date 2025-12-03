'use client';

import BookingForm from "@/src/forms/bookingForm";
import Link from "next/link";
import { useState, useEffect } from "react";
import getBrowserSupabase from "@/src/lib/supabase";

export default function HomePage() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    async function fetchBookings() {
      const supabase = getBrowserSupabase();

      // Find current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setBookings([]);
        return;
      }

      const nowISO = new Date().toISOString();

      // Hent KUN elevens egne bookinger (ikke ledige slots)
      const { data, error } = await supabase
        .from("booking")
        .select(
          `
          booking_id,
          starts_at,
          ends_at,
          title,
          facility:facility_id ( title )
        `
        )
        .eq("owner", user.id)
        .eq("role", "not_available")
        .gte("starts_at", nowISO)
        .order("starts_at", { ascending: true })
        .limit(3);

      if (error) {
        console.error("Failed to load student bookings", error);
        setBookings([]);
        return;
      }

      if (data) setBookings(data);
    }

    fetchBookings();
  }, []);

  return (
    <div className="flex">
      <div className="flex-1 py-8 px-20">
        <div>
          <BookingForm />
        </div>
      </div>

      <div className="w-80 bg-white p-6">
        <h2 className="text-xl font-bold mb-6">Kommende bookinger</h2>
        {bookings.length === 0 ? (
          <p className="text-gray-500">Ingen kommende bookinger</p>
        ) : (
          bookings.map((booking) => {
            const startDate = new Date(booking.starts_at);
            const endDate = booking.ends_at
              ? new Date(booking.ends_at)
              : null;

            const dateLabel = startDate.toLocaleDateString("da-DK", {
              day: "numeric",
              month: "long",
              timeZone: "Europe/Copenhagen"
            });

            const timeLabel = `${startDate.toLocaleTimeString("da-DK", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Copenhagen"
            })}-${
              endDate
                ? endDate.toLocaleTimeString("da-DK", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/Copenhagen"
                  })
                : "Ikke angivet"
            }`;

            // Use facility title from join, or fallback to parsed title
            const facilityName = booking.facility?.title || 
              (booking.title ? booking.title.split(" – ")[0] : "Lokale");

            return (
              <div
                key={booking.booking_id}
                className="mb-6 p-4 bg-gray-50 rounded-lg"
              >
                <h3 className="font-bold text-lg mb-3">{dateLabel}</h3>
                <div className="space-y-1 mb-4">
                  <p className="text-sm text-gray-700">
                    {facilityName}
                  </p>
                  <p className="text-sm text-gray-700">
                    {timeLabel}
                  </p>
                </div>
                <Link
                  href={`/student-home/${booking.booking_id}`}
                  className="block w-full bg-[#1864AB] text-white text-center py-3 rounded-full hover:bg-[#4E7CD9] transition-colors font-medium"
                >
                  Se booking
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
