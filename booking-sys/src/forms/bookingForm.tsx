// src/forms/bookingForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import getBrowserSupabase from "@/src/lib/supabase";
import { DatePickerInput } from "@mantine/dates";

// Generate time options for start (08–14) and end (10–16)
const generateStartTimeOptions = () => {
  const times: string[] = [];
  for (let hour = 8; hour <= 14; hour++) {
    const hourStr = hour.toString().padStart(2, "0");
    times.push(`${hourStr}:00`);
  }
  return times;
};

const generateEndTimeOptions = () => {
  const times: string[] = [];
  for (let hour = 10; hour <= 16; hour++) {
    const hourStr = hour.toString().padStart(2, "0");
    times.push(`${hourStr}:00`);
  }
  return times;
};

export default function BookingForm() {
  const router = useRouter();
  const startTimeOptions = generateStartTimeOptions();
  const endTimeOptions = generateEndTimeOptions();

  // Accept both Date and string, because we’ve seen "2025-12-04" at runtime
  const [dateValue, setDateValue] = useState<Date | string | null>(null);

  // today's date as minimum selectable date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const start = String(formData.get("start") || "").trim();
    const end = String(formData.get("end") || "").trim();

    console.log("[BOOKING FORM] raw dateValue on submit:", dateValue);

    if (!dateValue) {
      alert("Vælg venligst en dato.");
      return;
    }

    // Normalize dateValue to a real JS Date
    let jsDate: Date | null = null;

    if (dateValue instanceof Date) {
      jsDate = dateValue;
    } else if (typeof dateValue === "string") {
      console.log("[BOOKING FORM] parsing string dateValue:", dateValue);
      const parsed = new Date(dateValue);
      if (!Number.isNaN(parsed.getTime())) {
        jsDate = parsed;
      } else {
        console.error(
          "[BOOKING FORM] could not parse string date:",
          dateValue
        );
        alert("Ugyldig dato valgt.");
        return;
      }
    }

    if (!jsDate) {
      console.error("[BOOKING FORM] jsDate is null after normalization");
      alert("Ugyldig dato valgt.");
      return;
    }

    // Weekend check (0 = Sunday, 6 = Saturday)
    const selectedDay = jsDate.getDay();
    console.log("[BOOKING FORM] selectedDay (0=Sun..6=Sat):", selectedDay);

    if (selectedDay === 0 || selectedDay === 6) {
      alert("Du kan kun booke lokaler mandag til fredag.");
      return;
    }

    // Convert Date → YYYY-MM-DD for slug
    const year = jsDate.getFullYear();
    const month = String(jsDate.getMonth() + 1).padStart(2, "0");
    const day = String(jsDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    console.log("[BOOKING FORM] final slug dateStr:", dateStr);

    // Decide teacher vs student by email
    const supabase = getBrowserSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const email = user?.email ?? "";
    console.log("[BOOKING FORM] current user email:", email);

    let basePath = "/student-home"; // fallback
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

    console.log("[BOOKING FORM] final navigation URL:", url);
    router.push(url);
  }

  return (
    <div>
      <form className="space-y-6" onSubmit={onSubmit}>
        <h2 className="mb-6 text-2xl font-bold text-gray-800">
          Book et lokale
        </h2>

        {/* Dato */}
        <div className="space-y-2">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Dato <span className="text-red-600">*</span>
          </span>
          <small className="mb-2 block text-xs text-gray-500">
            OBS! Du kan kun booke et lokale i hverdage mellem 8-16.
          </small>
          <DatePickerInput
            // Always give Mantine a Date | null, even if our state might have held a string
            value={
              dateValue instanceof Date
                ? dateValue
                : typeof dateValue === "string"
                ? new Date(dateValue)
                : null
            }
            onChange={(value) => {
              console.log("[BOOKING FORM] onChange value:", value);
              // Mantine gives Date | null here
              setDateValue(value ?? null);
            }}
            placeholder="Vælg dato"
            minDate={today}
            valueFormat="DD/MM/YYYY"
            required
            classNames={{
              input:
                "max-w-md px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-500",
            }}
          />
        </div>

        {/* Starttidspunkt */}
        <div className="space-y-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Starttidspunkt
            </span>
            <small className="mb-2 block text-xs text-gray-500">
              OBS! Du kan maks booke et lokale i 4 timer.
            </small>
            <select
              name="start"
              className="block w-full max-w-xs rounded-md border border-gray-200 px-3 py-2 text-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Vælg tidspunkt</option>
              {startTimeOptions.map((time) => (
                <option key={`start-${time}`} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Sluttidspunkt */}
        <div className="space-y-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Sluttidspunkt
            </span>
            <small className="mb-2 block text-xs text-gray-500">
              OBS! Du kan maks booke et lokale i 4 timer.
            </small>
            <select
              name="end"
              className="block w-full max-w-xs rounded-md border border-gray-200 px-3 py-2 text-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Vælg tidspunkt</option>
              {endTimeOptions.map((time) => (
                <option key={`end-${time}`} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Kapacitet (still just visual for now) */}
        <div className="space-y-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Kapacitet
            </span>
            <select
              defaultValue=""
              className="block w-full max-w-xs rounded-md border border-gray-200 px-3 py-2 text-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Vælg kapacitet</option>
              <option value="1">1</option>
              <option value="2-4">2-4</option>
              <option value="4-8">4-8</option>
              <option value="8+">8+</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          className="max-w-xs rounded-full bg-[#1864AB] py-2 px-4 font-medium text-white transition-colors hover:bg-[#4E7CD9] focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Søg
        </button>
      </form>
    </div>
  );
}
