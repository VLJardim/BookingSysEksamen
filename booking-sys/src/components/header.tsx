"use client";

import { Group, Text } from "@mantine/core";
import { IconCalendar } from "@tabler/icons-react";

export default function Header() {
  return (
    <div className="w-full bg-blue-300 py-3 px-6">
      <Group gap="xs">
        <IconCalendar size={24} color="white" />
        <Text size="lg" fw={700} c="white">
          BookIt
        </Text>
      </Group>
    </div>
  );
}
