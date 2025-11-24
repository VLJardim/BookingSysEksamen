"use client";

import { Card, Text } from "@mantine/core";

interface BookingCardProps {
  roomName: string;
  date: string;
  time: string;
}

export default function BookingCard({ roomName, date, time }: BookingCardProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md">
      <Text fw={700}>{roomName}</Text>
      <Text>{date}</Text>
      <Text>{time}</Text>
    </Card>
  );
}
