"use client";

import { Group, Text } from "@mantine/core";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import getBrowserSupabase from "@/src/lib/supabase";

export default function Header() {
  const router = useRouter();
  const [homeRoute, setHomeRoute] = useState<string | null>(null);

  useEffect(() => {
    async function determineHomeRoute() {
      const supabase = getBrowserSupabase();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setHomeRoute(null);
        return;
      }

      const email = user.email ?? "";
      if (email.endsWith("@ek.dk")) {
        setHomeRoute("/teacher-home");
      } else if (email.endsWith("@stud.ek.dk")) {
        setHomeRoute("/student-home");
      } else {
        setHomeRoute("/student-home"); // fallback
      }
    }

    determineHomeRoute();
  }, []);

  const handleLogoClick = () => {
    if (homeRoute) {
      router.push(homeRoute);
    }
  };

  return (
    <div className="w-full bg-[#BFD3FF] py-3 px-6">
      <Group 
        gap="xs" 
        onClick={handleLogoClick}
        className={homeRoute ? "cursor-pointer" : ""}
      >
        <Image src="/logo.png" alt="BookIt Logo" width={24} height={24} />
        <Text size="lg" fw={700} c="black">
          BookIt
        </Text>
      </Group>
    </div>
  );
}
