"use client";

import Link from "next/link";
import { Stack, Text } from "@mantine/core";

interface NavBarProps {
  showLinks?: boolean;
}

export default function NavBar({ showLinks = true }: NavBarProps) {
  return (
    <Stack gap="md" p="md" bg="blue.6" className="w-64 min-h-screen">
      {showLinks && (
        <Stack gap="xs">
          <Link href="/home" className="text-white hover:underline">Home</Link>
          <Link href="/my-bookings" className="text-white hover:underline">My Bookings</Link>
          <Link href="/profile" className="text-white hover:underline">Profile</Link>
        </Stack>
      )}
    </Stack>
  );
}
