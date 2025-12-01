"use client";

import { usePathname } from "next/navigation";
import NavBar from "./navBar";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't show navbar links on login and register pages
  const showLinks = pathname !== "/login" && pathname !== "/register";

  return (
    <div className="flex min-h-screen">
      <NavBar showLinks={showLinks} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
