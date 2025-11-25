// src/app/api/bookings/route.ts
import { NextResponse } from "next/server";
import adminSupabase from "../../../src/lib/serverSupabase";
import { bookingCreateSchema } from "../../../src/lib/schemas/dbSchemas";
import { getCurrentUserWithRole } from "../../../src/lib/authHelper";

export async function GET() {
  const supabase = adminSupabase;

  const { data, error } = await supabase
    .from("booking")
    .select("*")
    .order("starts_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch bookings", details: error },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 200 });
}

export async function POST(req: Request) {
  const { user } = await getCurrentUserWithRole();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();

  // We don't want the client to decide "owner" → we control it here
  const parsed = bookingCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = adminSupabase;

  const { data, error } = await supabase
    .from("booking")
    .insert({
      ...parsed.data,
      owner: user.id,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create booking", details: error },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
