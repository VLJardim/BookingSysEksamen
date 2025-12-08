// src/forms/bookingForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import getBrowserSupabase from "@/src/lib/supabase";
import { DatePickerInput } from "@mantine/dates";
import ConfirmationModal from "@/src/components/confirmationModal";
import { getErrorMessage } from "@/src/lib/errorMessages";

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

  // Accept both Date and string, because vi har set "2025-12-04" i runtime
  const [dateValue, setDateValue] = useState<Date | string | null>(null);

  // Form-fejl til vores egen modal (fx manglende dato)
  const [formError, setFormError] = useState<string | null>(null);

  // dagens dato som minimum
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const start = String(formData.get("start") || "").trim(); // "08:00"
    const end = String(formData.get("end") || "").trim(); // "12:00"
    const capacity = String(formData.get("capacity") || "").trim(); // "2-4" osv.

    console.log("[BOOKING FORM] raw dateValue on submit:", dateValue);
    console.log("[BOOKING FORM] filters:", { start, end, capacity });

    // 🔹 Validate time range: slut > start
    if (start && end && end <= start) {
      alert("Sluttidspunkt skal være senere end starttidspunkt.");
      return;
    }

    // 🔹 Ingen dato valgt → brug vores egen modal (ikke browser-popup)
    if (!dateValue) {
      setFormError(getErrorMessage("FORM_DATE_REQUIRED"));
      return;
    }

    // Normaliser dateValue til en rigtig Date
    let jsDate: Date | null = null;

    if (dateValue instanceof Date) {
      jsDate = dateValue;
    } else if (typeof dateValue === "string") {
      console.log("[BOOKING FORM] parsing string dateValue:", dateValue);
      const parsed = new Date(dateValue);
      if (!Number.isNaN(parsed.getTime())) {
        jsDate = parsed;
      } else {
        console.error("[BOOKING FORM] could not parse string date:", dateValue);
        alert("Ugyldig dato valgt.");
        return;
      }
    }

    if (!jsDate) {
      console.error("[BOOKING FORM] jsDate is null after normalization");
      alert("Ugyldig dato valgt.");
      return;
    }

    // Weekend check (0 = søn, 6 = lør)
    const selectedDay = jsDate.getDay();
    console.log("[BOOKING FORM] selectedDay (0=Sun..6=Sat):", selectedDay);

    if (selectedDay === 0 || selectedDay === 6) {
      alert("Du kan kun booke lokaler mandag til fredag.");
      return;
    }

    // Date → "YYYY-MM-DD" til slug
    const year = jsDate.getFullYear();
    const month = String(jsDate.getMonth() + 1).padStart(2, "0");
    const day = String(jsDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    console.log("[BOOKING FORM] final slug dateStr:", dateStr);

    // Find teacher vs student via email
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
    if (capacity) params.set("capacity", capacity);

    const qs = params.toString();
    if (qs) url += `?${qs}`;

    console.log("[BOOKING FORM] final navigation URL:", url);
    router.push(url);
  }

  return (
    <>
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
            value={
              dateValue instanceof Date
                ? dateValue
                : typeof dateValue === "string"
                ? new Date(dateValue)
                : null
            }
            onChange={(value) => {
              console.log("[BOOKING FORM] onChange value:", value);
              setDateValue(value ?? null);
            }}
            placeholder="Vælg dato"
            minDate={today}
            valueFormat="DD/MM/YYYY"
            // ❌ ingen "required" → ingen browser-popup
            classNames={{
              input:
                "w-full max-w-xs px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-500",
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
              Du kan booke i blokke á 2 timer og maks. 4 timer i alt pr. dag.
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
              Du kan booke i blokke á 2 timer og maks. 4 timer i alt pr. dag.
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

        {/* Kapacitet */}
        <div className="space-y-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Kapacitet
            </span>
            <select
              name="capacity"
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

      {/* Modal til form-fejl (fx manglende dato) */}
      <ConfirmationModal
        isOpen={formError !== null}
        title="Dato mangler"
        message={formError ?? ""}
        confirmLabel="OK"
        onConfirm={() => setFormError(null)}
        onClose={() => setFormError(null)}
      />
    </>
  );
}
