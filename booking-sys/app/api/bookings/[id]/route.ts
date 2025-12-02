// app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import getAdminSupabase from "../../../../src/lib/serverSupabase";

// GET /api/bookings/:id  – fetch a single booking
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  console.log("[API GET] /api/bookings/%s", id);

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("booking")
    .select("*")
    .eq("booking_id", id)
    .maybeSingle();

  console.log("[API GET] select result:", { data, error });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch booking", details: error },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Booking not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data, { status: 200 });
}

// DELETE /api/bookings/:id  – "cancel" booking = make slot available again
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  console.log("[API DELETE] /api/bookings/%s", id);

  const supabase = getAdminSupabase();

  // First, log what row we see BEFORE update
  const { data: before, error: beforeError } = await supabase
    .from("booking")
    .select("booking_id, role, owner")
    .eq("booking_id", id)
    .maybeSingle();

  console.log("[API DELETE] row before update:", { before, beforeError });

  if (beforeError) {
    return NextResponse.json(
      { error: "Failed to lookup booking", details: beforeError },
      { status: 500 }
    );
  }

  if (!before) {
    return NextResponse.json(
      { error: "Booking not found before cancel" },
      { status: 404 }
    );
  }

  // Reset slot to available
  const { data, error } = await supabase
    .from("booking")
    .update({
      role: "available",
      owner: null,
    })
    .eq("booking_id", id)
    .select("booking_id, role, owner")
    .maybeSingle();

  console.log("[API DELETE] row after update:", { data, error });

  if (error) {
    return NextResponse.json(
      { error: "Failed to cancel booking", details: error },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Booking not found after cancel" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
