"use client";

import { Button as MantineButton } from "@mantine/core";

interface ButtonProps {
  label: string;
  onClick?: () => void;
  variant?: "filled" | "outline" | "light";
  type?: "button" | "submit";
}

export default function Button({
  label,
  onClick,
  variant = "filled",
  type = "button",
}: ButtonProps) {
  return (
    <MantineButton variant={variant} onClick={onClick} type={type}>
      {label}
    </MantineButton>
  );
}
