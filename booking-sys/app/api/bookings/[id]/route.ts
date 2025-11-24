// src/app/api/bookings/[id]/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../src/lib/serverSupabase";
import { bookingInsertSchema } from "../../../src/lib/schemas/dbSchemas";
import { getCurrentUserWithRole } from "../../../src/lib/authHelper";

type RouteParams = {
  params: { id: string };
};

export async function GET(_req: Request, { params }: RouteParams) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("booking")
    .select("*")
    .eq("booking_id", params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch booking", details: error },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { user, role } = await getCurrentUserWithRole();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  // 1) Get existing booking
  const { data: existing, error: fetchError } = await supabase
    .from("booking")
    .select("*")
    .eq("booking_id", params.id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json(
      { error: "Failed to fetch booking", details: fetchError },
      { status: 500 }
    );
  }

  if (!existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // 2) Permission check
  const isTeacher = role === "teacher";
  const isOwner = existing.owner === user.id;

  if (!isTeacher && !isOwner) {
    return NextResponse.json(
      { error: "Forbidden: you cannot modify this booking" },
      { status: 403 }
    );
  }

  // 3) Validate payload
  const body = await req.json();

  // Partial update: all fields optional, but still validated if present.
  const updateSchema = bookingInsertSchema
    .omit({ owner: true, booking_id: true })
    .partial();

  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("booking")
    .update(parsed.data)
    .eq("booking_id", params.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update booking", details: error },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { user, role } = await getCurrentUserWithRole();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  // First fetch to check owner + existence
  const { data: existing, error: fetchError } = await supabase
    .from("booking")
    .select("booking_id, owner")
    .eq("booking_id", params.id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json(
      { error: "Failed to fetch booking", details: fetchError },
      { status: 500 }
    );
  }

  if (!existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const isTeacher = role === "teacher";
  const isOwner = existing.owner === user.id;

  if (!isTeacher && !isOwner) {
    return NextResponse.json(
      { error: "Forbidden: you cannot delete this booking" },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("booking")
    .delete()
    .eq("booking_id", params.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete booking", details: error },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
