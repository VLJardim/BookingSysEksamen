"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import getBrowserSupabase from "@/src/lib/supabase";
import ConfirmationModal from "@/src/components/confirmationModal";

interface CurrentBooking {
  booking_id: string;
  starts_at: string;
  ends_at: string;
  facility_id: string;
  role: string;
  owner: string | null;
  title?: string;
  facilityInfo?: {
    name: string;
    location: string;
  } | null;
}

interface ModalConfig {
  isOpen: boolean;
  message: string;
  isError: boolean;
}

export default function EditBooking() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;

  const [booking, setBooking] = useState<CurrentBooking | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [capacity, setCapacity] = useState("4-8");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalConfig>({
    isOpen: false,
    message: "",
    isError: false,
  });

  // Generate time options in hourly intervals from 08:00 to 15:00
  const timeOptions = [];
  for (let hour = 8; hour < 16; hour++) {
    const hourStr = hour.toString().padStart(2, "0");
    timeOptions.push(`${hourStr}:00`);
  }

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;

      const supabase = getBrowserSupabase();

      const { data, error } = await (supabase as any)
        .from("booking")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();

      console.log("Fetch booking result:", { data, error, bookingId });

      if (error) {
        console.error("Error fetching booking:", error);
        setModal({
          isOpen: true,
          message: `Fejl: ${error.message}`,
          isError: true,
        });
        setLoading(false);
        return;
      }

      if (!data) {
        console.error("No booking found for ID:", bookingId);
        setModal({
          isOpen: true,
          message: "Booking ikke fundet",
          isError: true,
        });
        setLoading(false);
        return;
      }

      setBooking(data as never);

      // Parse the existing booking times as UTC
      const startsAt = new Date(data.starts_at);
      const endsAt = new Date(data.ends_at);

      // Set date (YYYY-MM-DD format for input)
      setSelectedDate(startsAt.toISOString().split("T")[0]);

      // Set times (HH:00 format) - use UTC hours
      setStartTime(
        `${startsAt.getUTCHours().toString().padStart(2, "0")}:00`
      );
      setEndTime(`${endsAt.getUTCHours().toString().padStart(2, "0")}:00`);

      setLoading(false);
    };

    fetchBooking();
  }, [bookingId]);

  const handleSubmit = async () => {
    if (!selectedDate || !startTime || !endTime || !booking) {
      setModal({
        isOpen: true,
        message: "Alle felter skal udfyldes",
        isError: true,
      });
      return;
    }

    // Validate date is not a weekend
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      setModal({
        isOpen: true,
        message: "Du kan ikke booke i weekenden",
        isError: true,
      });
      return;
    }

    // Validate end time is after start time
    const startHour = parseInt(startTime.split(":")[0]);
    const endHour = parseInt(endTime.split(":")[0]);

    if (endHour <= startHour) {
      setModal({
        isOpen: true,
        message: "Sluttidspunkt skal være efter starttidspunkt",
        isError: true,
      });
      return;
    }

    // Validate times are within business hours (08:00 - 17:00)
    if (startHour < 8 || endHour > 17) {
      setModal({
        isOpen: true,
        message: "Bookinger skal være mellem 08:00 og 17:00",
        isError: true,
      });
      return;
    }

    // Create ISO timestamp strings in UTC
    const startsAt = `${selectedDate}T${startTime}:00Z`;
    const endsAt = `${selectedDate}T${endTime}:00Z`;

    const supabase = getBrowserSupabase();

    // Update the booking
    const result: any = await (supabase as any)
      .from("booking")
      .update({
        starts_at: startsAt,
        ends_at: endsAt,
      })
      .eq("booking_id", bookingId);
    
    const { error } = result;

    if (error) {
      setModal({
        isOpen: true,
        message: "Kunne ikke opdatere booking",
        isError: true,
      });
      return;
    }

    setModal({
      isOpen: true,
      message: "Booking opdateret",
      isError: false,
    });

    // Redirect back to my-bookings after a short delay
    setTimeout(() => {
      router.push("/my-bookings");
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Indlæser...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Booking ikke fundet</p>
      </div>
    );
  }

  return (
    <div className="flex-1 py-8 px-20">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Rediger booking
        </h2>

        {booking && (
          <div className="max-w-md mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-semibold text-gray-800">{booking.title || "Booking"}</h3>
            <p className="text-sm text-gray-600">
              {new Date(booking.starts_at).toLocaleString("da-DK")} - {new Date(booking.ends_at).toLocaleString("da-DK")}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <span className="block text-sm font-medium text-gray-700 mb-1">
            Dato <span className="text-red-600">*</span>
          </span>
          <small className="block text-xs text-gray-500 mb-2">
            OBS! Du kan kun booke et lokale i hverdage mellem 8-16.
          </small>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="block w-full max-w-md px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer text-gray-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">
              Starttidspunkt
            </span>
            <small className="block text-xs text-gray-500 mb-2">
              OBS! Du kan maks booke et lokale i 4 timer.
            </small>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="block w-full max-w-xs px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-500"
            >
              <option value="">Vælg tidspunkt</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">
              Sluttidspunkt
            </span>
            <small className="block text-xs text-gray-500 mb-2">
              OBS! Du kan maks booke et lokale i 4 timer.
            </small>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="block w-full max-w-xs px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-500"
            >
              <option value="">Vælg tidspunkt</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">
              Kapacitet
            </span>
            <select
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="block w-full max-w-xs px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-500"
            >
              <option value="1">1</option>
              <option value="2-4">2-4</option>
              <option value="4-8">4-8</option>
              <option value="8+">8+</option>
            </select>
          </label>
        </div>

        <button
          onClick={handleSubmit}
          className="max-w-xs bg-[#1864AB] text-white py-3 px-8 rounded-full hover:bg-[#4E7CD9] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
        >
          Gem
        </button>
      </div>

      <ConfirmationModal
        isOpen={modal.isOpen}
        title={modal.isError ? "Fejl" : "Succes"}
        message={modal.message}
        onClose={() => {
          setModal({ isOpen: false, message: "", isError: false });
          if (!modal.isError) {
            router.push("/my-bookings");
          }
        }}
      />
    </div>
  );
}
