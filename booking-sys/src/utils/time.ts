// src/utils/time.ts
export function formatBookingInterval(
  startsAt: string,
  endsAt?: string | null
) {
  const timeZone = "Europe/Copenhagen";

  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : null;

  const dateLabel = start.toLocaleDateString("da-DK", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone,
  });

  const timeLabel =
    start.toLocaleTimeString("da-DK", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    }) +
    (end
      ? " - " +
        end.toLocaleTimeString("da-DK", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone,
        })
      : "");

  return { dateLabel, timeLabel };
}
