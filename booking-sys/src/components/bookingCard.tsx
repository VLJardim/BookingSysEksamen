"use client";

import { Card, Text } from "@mantine/core";

interface BookingCardProps {
  bookingId: string;                  // hvilket konkret slot vi booker
  roomName: string;
  date: string;                       // kan være "YYYY-MM-DD" eller allerede formateret tekst
  time: string;                       // fx "10:00 - 12:00"
  capacity?: string | null;           // kapacitetstekst, fx "3-4 pers"
  onBook?: (bookingId: string) => void;
  actionLabel?: string;               // valgfrit: tekst på knappen
  notice?: string;                    // valgfrit: ekstra tekst (fx "Allerede booket ...")
}

export default function BookingCard({
  bookingId,
  roomName,
  date,
  time,
  capacity,
  onBook,
  actionLabel,
  notice,
}: BookingCardProps) {
  const handleClick = () => {
    if (onBook) onBook(bookingId);
  };

  const label = actionLabel ?? "Book dette tidsrum";

  // 🔹 Hvis `date` ligner "YYYY-MM-DD", formatter til "3. December" på dansk
  const prettyDate = (() => {
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (isoDatePattern.test(date)) {
      const d = new Date(date + "T00:00:00");
      if (!Number.isNaN(d.getTime())) {
        let formatted = d.toLocaleDateString("da-DK", {
          day: "numeric",
          month: "long", // "december" i stedet for "12"
        });

        // Capitalize månedsnavn (efter "day. ")
        formatted = formatted.replace(
          /(\d+\.\s*)([a-zæøå])/,
          (match, prefix, firstLetter) => prefix + firstLetter.toUpperCase()
        );

        return formatted;
      }
    }

    // fallback: brug bare den tekst vi fik
    return date;
  })();

  const capacityLabel =
    capacity && capacity.trim().length > 0 ? capacity : "Ukendt";

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      className="flex h-full flex-col justify-between"
    >
      <div className="space-y-1">
        {/* 1) Dato + tidsrum */}
        <Text size="md" c="dimmed">
          {prettyDate}
        </Text>

        {/* 2) Lokale-navn */}
        <Text fw={600} size="lg">
          Lokale: {roomName}
        </Text>

        {/* 3) tidsrum */}
        <Text size="sm" className="text-gray-700">
          Tidsrum: {time}
        </Text>

        {/* 4) Kapacitet */}
        <Text size="sm" className="text-gray-700">
          Kapacitet: {capacityLabel}
        </Text>

        {/* Evt. ekstra notice */}
        {notice && (
          <Text size="xs" c="red" className="mt-2">
            {notice}
          </Text>
        )}
      </div>

      {/* 4) Book-knap */}
      <button
        type="button"
        onClick={handleClick}
        className="mt-4 w-full rounded-full bg-[#1864AB] px-4 py-2 text-sm font-medium text-white hover:bg-[#4E7CD9] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        {label}
      </button>
    </Card>
  );
}
