"use client";

import { Group, Text } from "@mantine/core";
import Image from "next/image";

export default function Header() {
  return (
    <div className="w-full bg-[#BFD3FF] py-3 px-6">
      <Group gap="xs">
        <Image src="/logo.png" alt="BookIt Logo" width={24} height={24} />
        <Text size="lg" fw={700} c="black">
          BookIt
        </Text>
      </Group>
    </div>
  );
}
