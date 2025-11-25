"use client";

import { Card, Text, Avatar } from "@mantine/core";

interface ProfileCardProps {
  name: string;
  email: string;
}

export default function ProfileCard({ name, email }: ProfileCardProps) {
  return (
    <Card padding="lg" radius="md" shadow="sm">
      <Avatar radius="xl" size="lg" mb="md" />

      <Text fw={700}>{name}</Text>
      <Text>{email}</Text>
    </Card>
  );
}
