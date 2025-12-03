// src/utils/time.ts

// Helper: format a stored ISO timestamp *without* applying timezone shifts.
// We treat the "HH:MM" part as the real school time.
export function formatBookingInterval(
  startsAt: string,
  endsAt?: string | null
) {
  // Example startsAt: "2025-12-04T10:00:00+00:00"

  const [startDatePart, startTimePartRaw] = startsAt.split("T");
  const [yearStr, monthStr, dayStr] = startDatePart.split("-");

  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1; // JS months are 0-based
  const day = Number(dayStr);

  // Build a local Date just for pretty-printing the *date*,
  // but we ignore the time here so timezone doesn't matter.
  const dateObj = new Date(year, monthIndex, day);

  const dateLabel = dateObj.toLocaleDateString("da-DK", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });

  // Extract naive HH:MM from the raw time part
  const formatTime = (iso: string) => {
    const timePart = iso.split("T")[1] ?? ""; // "10:00:00+00:00"
    const hhmm = timePart.slice(0, 5);        // "10:00"
    return hhmm;
  };

  const startTime = formatTime(startsAt);
  const endTime = endsAt ? formatTime(endsAt) : "";

  const timeLabel = endTime ? `${startTime} - ${endTime}` : startTime;

  return { dateLabel, timeLabel };
}
