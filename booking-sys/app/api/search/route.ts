// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import getAdminSupabase from "../../../src/lib/serverSupabase";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date"); // fx "2025-12-02"

    if (!dateParam) {
      return NextResponse.json(
        { error: "Missing date parameter" },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json(
        { error: "Invalid date format, expected YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const startDate = new Date(dateParam + "T00:00:00Z");
    if (Number.isNaN(startDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const nextDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    const nextDateStr = nextDate.toISOString().slice(0, 10); // "YYYY-MM-DD"

    const supabase = getAdminSupabase();

    // 1) RAW DEBUG: hent ALT fra booking (ingen filtre)
    const {
      data: allRows,
      error: allError,
    } = await supabase
      .from("booking")
      .select("booking_id, starts_at, ends_at, role, facility_id")
      .order("starts_at", { ascending: true });

    console.log(
      "[/api/search] DEBUG raw rows count =",
      allRows?.length ?? 0,
      "error =",
      allError ?? null
    );
    console.log(
      "[/api/search] DEBUG first 5 rows =",
      (allRows ?? []).slice(0, 5)
    );

    if (allError) {
      return NextResponse.json(
        { error: "Supabase error", details: allError },
        { status: 500 }
      );
    }

    // Hvis databasen svarer 0 rækker her, er problemet 100% på DB/RLS/projekt-niveau
    if (!allRows || allRows.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // 2) Filter i JS på dato + role, så vi kan se præcis hvad der bliver sorteret fra
    const rangeStart = `${dateParam}T00:00:00Z`;
    const rangeEnd = `${nextDateStr}T00:00:00Z`;

    const filtered = allRows.filter((row) => {
      const ts = row.starts_at as string;
      return (
        row.role === "available" &&
        ts >= rangeStart &&
        ts < rangeEnd
      );
    });

    console.log(
      "[/api/search] DEBUG filtered rows count =",
      filtered.length,
      "for date =",
      dateParam,
      "range =",
      rangeStart,
      "->",
      rangeEnd
    );

    // 3) Join facility-info ved endnu et opslag (simpelt, men fint til projektet)
    const facilityIds = Array.from(
      new Set(filtered.map((r) => r.facility_id).filter(Boolean))
    ) as string[];

    const facilitiesById: Record<
      string,
      {
        facility_id: string;
        title: string;
        capacity?: string | null;
        description?: string | null;
        facility_type?: string | null;
      }
    > = {};

    if (facilityIds.length > 0) {
      const { data: facilities, error: facError } = await supabase
        .from("facility")
        .select("facility_id, title, capacity, description, facility_type")
        .in("facility_id", facilityIds);

      if (facError) {
        console.error("[/api/search] facility error", facError);
      }

      for (const f of facilities ?? []) {
        facilitiesById[f.facility_id] = f;
      }
    }

    // 4) Byg det samme shape som før (facility med slots[])
    const grouped: Record<
      string,
      {
        facility_id: string;
        title: string;
        capacity?: string | null;
        description?: string | null;
        facility_type?: string | null;
        slots: {
          booking_id: string;
          starts_at: string;
          ends_at: string | null;
        }[];
      }
    > = {};

    for (const row of filtered) {
      const fac = facilitiesById[row.facility_id as string];
      if (!fac) continue;

      if (!grouped[fac.facility_id]) {
        grouped[fac.facility_id] = {
          facility_id: fac.facility_id,
          title: fac.title,
          capacity: fac.capacity,
          description: fac.description,
          facility_type: fac.facility_type,
          slots: [],
        };
      }

      grouped[fac.facility_id].slots.push({
        booking_id: row.booking_id as string,
        starts_at: row.starts_at as string,
        ends_at: row.ends_at as string | null,
      });
    }

    const facilities = Object.values(grouped);
    return NextResponse.json(facilities, { status: 200 });
  } catch (err) {
    console.error("search internal error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
