import { NextResponse } from "next/server";
import getAdminSupabase from "@/src/lib/serverSupabase";

// Small helpers
function parseDateParam(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  // Expect YYYY-MM-DD
  const d = new Date(dateStr + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");
  const mode = url.searchParams.get("mode"); // "teacher" | null

  const day = parseDateParam(dateParam);
  if (!day) {
    return NextResponse.json(
      { error: "Invalid or missing date parameter (expected YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  // Build [start, end) UTC range for that calendar day
  const start = new Date(day.getTime());
  const end = new Date(day.getTime());
  end.setUTCDate(end.getUTCDate() + 1);

  const startISO = start.toISOString();
  const endISO = end.toISOString();

  console.log(
    "[/api/search] REQUEST date =",
    dateParam,
    "mode =",
    mode,
    "range =",
    startISO,
    "->",
    endISO
  );

  const supabase = getAdminSupabase();

  let query = supabase
    .from("booking")
    .select(
      `
      booking_id,
      starts_at,
      ends_at,
      role,
      owner,
      facility:facility_id (
        facility_id,
        title,
        capacity,
        description,
        facility_type
      )
    `
    )
    .gte("starts_at", startISO)
    .lt("starts_at", endISO)
    .order("starts_at", { ascending: true });

  // Students: only available.
  // Teachers (mode=teacher): see all roles.
  if (mode !== "teacher") {
    query = query.eq("role", "available");
  }

  const { data, error } = await query;

  if (error) {
    console.error("[/api/search] Supabase error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings", details: error },
      { status: 500 }
    );
  }

  const rows = data ?? [];

  type Slot = {
    booking_id: string;
    starts_at: string;
    ends_at?: string | null;
    role: "available" | "not_available";
    owner: string | null;
  };

  type FacilityDTO = {
    facility_id: string;
    title: string;
    capacity?: string | null;
    description?: string | null;
    facility_type?: string | null;
    slots: Slot[];
  };

  const facilitiesMap = new Map<string, FacilityDTO>();

  for (const row of rows as any[]) {
    const fac = row.facility;
    if (!fac) continue;

    let facility = facilitiesMap.get(fac.facility_id);
    if (!facility) {
      facility = {
        facility_id: fac.facility_id,
        title: fac.title,
        capacity: fac.capacity,
        description: fac.description,
        facility_type: fac.facility_type,
        slots: [],
      };
      facilitiesMap.set(fac.facility_id, facility);
    }

    facility.slots.push({
      booking_id: row.booking_id,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      role: row.role,
      owner: row.owner,
    });
  }

  const result = Array.from(facilitiesMap.values());
  return NextResponse.json(result, { status: 200 });
}
