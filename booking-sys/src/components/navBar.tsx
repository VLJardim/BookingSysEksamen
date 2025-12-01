"use client";

import Link from "next/link";
import { Stack } from "@mantine/core";
import { IconHome, IconUser, IconCalendar } from "@tabler/icons-react";

interface NavBarProps {
  showLinks?: boolean;
}

export default function NavBar({ showLinks = true }: NavBarProps) {
  return (
    <Stack gap="md" p="md" bg="#4E7CD9" className="w-64 min-h-screen">
      {showLinks && (
        <Stack gap="xs">
          <Link 
            href="/student-home" 
            className="flex items-center gap-3 bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <IconHome size={24} className="text-blue-600" />
            <span className="text-gray-900 font-medium">Book Lokale</span>
          </Link>
          
          <Link 
            href="/profile" 
            className="flex items-center gap-3 bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <IconUser size={24} className="text-green-600" />
            <span className="text-gray-900 font-medium">Profil</span>
          </Link>
          
          <Link 
            href="/my-bookings" 
            className="flex items-center gap-3 bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <IconCalendar size={24} className="text-purple-600" />
            <span className="text-gray-900 font-medium">Mine Bookinger</span>
          </Link>
        </Stack>
      )}
    </Stack>
  );
}
