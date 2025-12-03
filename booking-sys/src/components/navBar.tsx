"use client";

import Link from "next/link";
import { Stack } from "@mantine/core";
import { IconHome, IconUser, IconCalendar } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import getBrowserSupabase from "@/src/lib/supabase";

interface NavBarProps {
  showLinks?: boolean;
}

export default function NavBar({ showLinks = true }: NavBarProps) {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [basePath, setBasePath] = useState<string>("/student-home");

  useEffect(() => {
    async function fetchUser() {
      const supabase = getBrowserSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const name =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "";
        setUserName(name);

        // 🔹 Decide base path for "Book Lokale" based on email domain
        const email = user.email ?? "";
        if (email.endsWith("@ek.dk")) {
          setBasePath("/teacher-home");
        } else if (email.endsWith("@stud.ek.dk")) {
          setBasePath("/student-home");
        } else {
          // fallback
          setBasePath("/student-home");
        }
      }
    }

    fetchUser();
  }, []);

  return (
    <Stack gap="md" p="md" bg="#4E7CD9" className="w-64 min-h-screen">
      {showLinks && (
        <Stack gap="xs" className="sticky top-4">
          {/* 🔹 Book Lokale now routes to /teacher-home or /student-home depending on user */}
          <Link
            href={basePath}
            className="flex items-center gap-3 bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <IconHome size={24} className="text-blue-600" />
            <span className="text-gray-900 font-medium">Book Lokale</span>
          </Link>

          <Link
            href="/my-bookings"
            className="flex items-center gap-3 bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <IconCalendar size={24} className="text-purple-600" />
            <span className="text-gray-900 font-medium">Mine Bookinger</span>
          </Link>

          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-3 bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors w-full text-left cursor-pointer"
          >
            <IconUser size={24} className="text-green-600" />
            <span className="text-gray-900 font-medium">
              Profil{userName && ` (${userName})`}
            </span>
          </button>
        </Stack>
      )}
    </Stack>
  );
}
