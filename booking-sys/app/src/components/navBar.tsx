"use client";

import Link from "next/link";
import { Group, Text } from "@mantine/core";

export default function NavBar() {
  return (
    <Group justify="space-between" p="md" bg="gray.1">
      <Text fw={700}>Booking System</Text>

      <Group>
        <Link href="/home">Home</Link>
        <Link href="/my-bookings">My Bookings</Link>
        <Link href="/profile">Profile</Link>
      </Group>
    </Group>
  );
}
