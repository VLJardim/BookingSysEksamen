// src/app/api/auth/session/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserWithRole } from "../../../../src/lib/authHelper";

export async function GET() {
  const { user, role } = await getCurrentUserWithRole();

  if (!user) {
    return NextResponse.json(
      { user: null, role: null },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
      },
      role,
    },
    { status: 200 }
  );
}
