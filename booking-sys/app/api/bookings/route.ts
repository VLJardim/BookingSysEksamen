// app/api/bookings/route.ts
import { NextResponse } from "next/server";
import getAdminSupabase from "../../../src/lib/serverSupabase";
import { bookingCreateSchema } from "../../../src/lib/schemas/dbSchemas";

/**
 * GET /api/bookings
 * Simple admin/debug endpoint: returns all bookings ordered by starts_at.
 * Not used by your main UI, but handy to inspect data.
 */
export async function GET() {
  const supabase = getAdminSupabase();

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

/**
 * POST /api/bookings
 * Optional helper to create a booking row manually (e.g. via a tool or admin view).
 * Your normal booking flow does NOT use this – it updates existing slots instead.
 */
export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = bookingCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("booking")
    .insert(parsed.data) // no owner injection here; owner/null is controlled by schema/DB
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
