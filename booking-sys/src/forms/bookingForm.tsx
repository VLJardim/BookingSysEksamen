"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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

  // 🔹 controlled value for the date field
  const [date, setDate] = useState("");

  // 🔹 today's date for the "min" attribute
  const todayStr = new Date().toISOString().slice(0, 10);

  // 🔹 block Saturday/Sunday in the date picker
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (!value) {
      setDate("");
      e.target.setCustomValidity("");
      return;
    }

    const selected = new Date(value + "T00:00:00");
    const day = selected.getDay(); // 0 = Sunday, 6 = Saturday

    if (day === 0 || day === 6) {
      // weekend -> not allowed
      setDate("");
      e.target.value = "";
      e.target.setCustomValidity(
        "Du kan kun booke lokaler mandag til fredag."
      );
      e.target.reportValidity();
      return;
    }

    // weekday -> ok
    e.target.setCustomValidity("");
    setDate(value);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // we now use the controlled `date` state
    const start = String(formData.get("start") || "").trim();
    const end = String(formData.get("end") || "").trim();

    if (!date) return; // guard: date is required and must be weekday

    let url = `/student-home/${encodeURIComponent(date)}`;
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
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Book et lokale</h2>

        <div className="space-y-2">
          <span className="block text-sm font-medium text-gray-700 mb-1">
            Dato <span className="text-red-600">*</span>
          </span>
          <small className="block text-xs text-gray-500 mb-2">
            OBS! Du kan kun booke et lokale i hverdage mellem 8-16.
          </small>
          <div
            className="cursor-pointer"
            onClick={(e) => {
              const input = e.currentTarget.querySelector("input");
              // åbner browserens date-picker
              (input as HTMLInputElement | null)?.showPicker?.();
            }}
          >
            <input
              name="date"
              type="date"
              required
              min={todayStr}
              value={date}
              onChange={handleDateChange}
              className="block w-full max-w-md px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer text-gray-500"
            />
          </div>
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
              defaultValue="4-8"
              className="block w-full max-w-xs px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-500"
            >
              <option value="" disabled>
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
          className="max-w-xs bg-[#1864AB] text-white py-3 px-8 rounded-full hover:bg-[#4E7CD9] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
        >
          Søg
        </button>
      </form>

      {/* TODO: Render upcoming bookings here */}
    </div>
  );
}
