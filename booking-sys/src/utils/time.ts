// src/utils/time.ts

// Hjælper til at lave "December - 4" til headeren (datoen du har søgt på)
export function formatSearchDateLabel(dateStr: string | null | undefined) {
  if (!dateStr) return "";

  // Forventet format: "YYYY-MM-DD"
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const day = Number(dayStr);

  const d = new Date(year, monthIndex, day);

  let monthName = d.toLocaleDateString("da-DK", { month: "long" }); // "december"
  monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1); // "December"

  const dayLabel = day.toString(); // "4"

  return `${monthName} - ${dayLabel}`;
}

// Formatter der behandler den lagrede tid som "skole-tid" uden timezone-shift.
// Forventer noget a la: "2025-12-04T10:00:00+00:00"
export function formatBookingInterval(
  startsAt: string,
  endsAt?: string | null
) {
  const [datePart] = startsAt.split("T");
  const [yearStr, monthStr, dayStr] = datePart.split("-");

  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const day = Number(dayStr);

  const d = new Date(year, monthIndex, day);

  let monthName = d.toLocaleDateString("da-DK", { month: "long" }); // "december"
  monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1); // "December"

  const dateLabel = `${day}. ${monthName}`; // "4. December"

  const extractHHMM = (iso: string) => {
    const timePart = iso.split("T")[1] ?? ""; // "10:00:00+00:00"
    return timePart.slice(0, 5); // "10:00"
  };

  const startTime = extractHHMM(startsAt);
  const endTime = endsAt ? extractHHMM(endsAt) : "";

  const timeLabel = endTime ? `${startTime} - ${endTime}` : startTime;

  return { dateLabel, timeLabel };
}
