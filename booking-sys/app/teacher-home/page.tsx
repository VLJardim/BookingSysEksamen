// src/app/student-home/page.tsx
"use client";

import BookingForm from "@/src/forms/bookingForm";
import Link from "next/link";
import { useState, useEffect } from "react";
import getBrowserSupabase from "@/src/lib/supabase";
import { formatBookingInterval } from "@/src/utils/time";

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
            
            // Format date as "2. December" (day + month name)
            let dateStr = startDate.toLocaleDateString("da-DK", {
              month: "long",
              day: "numeric",
              timeZone: "Europe/Copenhagen"
            });
            // Capitalize month name (after "day. ")
            dateStr = dateStr.replace(/(\d+\.\s*)([a-z])/, (match, prefix, firstLetter) => 
              prefix + firstLetter.toUpperCase()
            );
            
            // Format time range as "12:00-14:00" (extract HH:MM from ISO string)
            const formatTime = (iso: string) => {
              const timePart = iso.split("T")[1] ?? "";
              return timePart.slice(0, 5); // "HH:MM"
            };
            
            const startTime = formatTime(booking.starts_at);
            const endTime = booking.ends_at ? formatTime(booking.ends_at) : "";
            const timeRange = endTime ? `${startTime}-${endTime}` : startTime;

            // Use facility title from join, or fallback to parsed title
            const facilityName =
              booking.facility?.title ||
              (booking.title ? booking.title.split(" – ")[0] : "Lokale");

            return (
              <div
                key={booking.booking_id}
                className="mb-4 p-4 bg-gray-50 rounded-lg"
              >
                <h3 className="font-bold text-lg mb-2">{facilityName}</h3>
                <p className="text-sm text-gray-600">{dateStr}</p>
                <p className="text-sm text-gray-600 mb-3">{timeRange}</p>
                <Link
                  href="/my-bookings"
                  className="block w-full bg-[#1864AB] text-white text-center py-2 rounded-full hover:bg-[#4E7CD9] transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
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
