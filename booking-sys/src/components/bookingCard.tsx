// src/components/bookingCard.tsx
"use client";

import { Card, Text, Badge } from "@mantine/core";

interface BookingCardProps {
  bookingId: string;                  // hvilket konkret slot vi booker
  roomName: string;
  date: string;
  time: string;
  onBook?: (bookingId: string) => void;
  actionLabel?: string;              // valgfrit: tekst på knappen
}

export default function BookingCard({
  bookingId,
  roomName,
  date,
  time,
  onBook,
  actionLabel,
}: BookingCardProps) {
  const handleClick = () => {
    if (onBook) onBook(bookingId);
  };

  const label = actionLabel ?? "Book dette tidsrum";

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      className="flex h-full flex-col justify-between"
    >
      <div>
        <Text fw={500} size="lg" className="mb-1">
          {roomName}
        </Text>
        <Text size="sm" c="dimmed" className="mb-2">
          {date}
        </Text>

        <Badge color="blue" variant="light">
          {time}
        </Badge>
      </div>

      <button
        type="button"
        onClick={handleClick}
        className="mt-4 w-full rounded-md bg-[#1864AB] px-3 py-2 text-sm font-medium text-white hover:bg-[#4E7CD9] focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {label}
      </button>
    </Card>
  );
}
