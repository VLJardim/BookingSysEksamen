// src/forms/bookingForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import getBrowserSupabase from "@/src/lib/supabase";
import { DatePickerInput } from "@mantine/dates";

// Generate time options in hourly intervals
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 8; hour < 16; hour++) {
    const hourStr = hour.toString().padStart(2, "0");
    times.push(`${hourStr}:00`);
  }
  return times;
};

export default function BookingForm() {
  const router = useRouter();
  const timeOptions = generateTimeOptions();

  // kontrolleret værdi til dato-feltet
  const [dateValue, setDateValue] = useState<Date | null>(null);

  // dagens dato til minimum
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const start = String(formData.get("start") || "").trim();
    const end = String(formData.get("end") || "").trim();

    if (!dateValue) return; // dato er påkrævet og skal være hverdag

    // Check if selected date is a weekend
    const selectedDay = dateValue.getDay();
    if (selectedDay === 0 || selectedDay === 6) {
      alert("Du kan kun booke lokaler mandag til fredag.");
      return;
    }

    // Convert date to YYYY-MM-DD format
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, "0");
    const day = String(dateValue.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    // 🔹 Find brugerens email for at afgøre om det er lærer eller elev
    const supabase = getBrowserSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let basePath = "/student-home"; // fallback

    const email = user?.email ?? "";

    if (email.endsWith("@ek.dk")) {
      basePath = "/teacher-home";
    } else if (email.endsWith("@stud.ek.dk")) {
      basePath = "/student-home";
    }

    let url = `${basePath}/${encodeURIComponent(dateStr)}`;

    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    const qs = params.toString();
    if (qs) url += `?${qs}`;

    router.push(url);
  }

  return (
    <div>
      <form className="space-y-6" onSubmit={onSubmit}>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Book et lokale
        </h2>

        <div className="space-y-2">
          <span className="block text-sm font-medium text-gray-700 mb-1">
            Dato <span className="text-red-600">*</span>
          </span>
          <small className="block text-xs text-gray-500 mb-2">
            OBS! Du kan kun booke et lokale i hverdage mellem 8-16.
          </small>
          <DatePickerInput
            value={dateValue}
            onChange={setDateValue}
            placeholder="Vælg dato"
            minDate={today}
            valueFormat="DD/MM/YYYY"
            required
            classNames={{
              input: "max-w-md px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-500"
            }}
            styles={{
              dropdown: {
                width: "max-content"
              }
            }}
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
              name="start"
              className="block w-full max-w-xs px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-500"
            >
              <option value="">Vælg tidspunkt</option>
              {timeOptions.map((time) => (
                <option key={`start-${time}`} value={time}>
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
              name="end"
              className="block w-full max-w-xs px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-500"
            >
              <option value="">Vælg tidspunkt</option>
              {timeOptions.map((time) => (
                <option key={`end-${time}`} value={time}>
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
              defaultValue=""
              className="block w-full max-w-xs px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-500"
            >
              <option value="">
                Vælg kapacitet
              </option>
              <option value="1">1</option>
              <option value="2-4">2-4</option>
              <option value="4-8">4-8</option>
              <option value="8+">8+</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          className="max-w-xs bg-[#1864AB] text-white py-2 px-4 rounded-full hover:bg-[#4E7CD9] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium"
        >
          Søg
        </button>
      </form>
    </div>
  );
}
