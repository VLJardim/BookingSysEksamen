"use client";

import Link from "next/link";
import { Stack, Text } from "@mantine/core";

export default function NavBar() {
  return (
    <Stack gap="md" p="md" bg="blue.6" className="w-64 min-h-screen">
      <Text fw={700} size="xl" c="white">Booking System</Text>

      <Stack gap="xs">
        <Link href="/home" className="text-white hover:underline">Home</Link>
        <Link href="/my-bookings" className="text-white hover:underline">My Bookings</Link>
        <Link href="/profile" className="text-white hover:underline">Profile</Link>
      </Stack>
    </Stack>
  );
}
