"use client";

import Link from "next/link";
import { Stack } from "@mantine/core";
import { IconHome, IconUser, IconCalendar } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import getBrowserSupabase from "@/src/lib/supabase";

interface NavBarProps {
  showLinks?: boolean;
}

export default function NavBar({ showLinks = true }: NavBarProps) {
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    async function fetchUser() {
      const supabase = getBrowserSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserEmail(user.email || "");
        // Try to get name from metadata, or use email prefix as fallback
        const name = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || "";
        setUserName(name);
      }
    }
    
    fetchUser();
  }, []);
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
      
      {/* User Profile Card at Bottom */}
      {showLinks && userEmail && (
        <div className="mt-auto bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <IconUser size={20} className="text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {userName || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {userEmail}
              </p>
            </div>
          </div>
        </div>
      )}
    </Stack>
  );
}
