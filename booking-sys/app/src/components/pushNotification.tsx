"use client";

import { Alert, Text } from "@mantine/core";

interface PushNotificationProps {
  message: string;
  type?: "success" | "error" | "info";
}

export default function PushNotification({
  message,
  type = "info",
}: PushNotificationProps) {
  return (
    <Alert color={type === "error" ? "red" : type === "success" ? "green" : "blue"}>
      <Text>{message}</Text>
    </Alert>
  );
}
