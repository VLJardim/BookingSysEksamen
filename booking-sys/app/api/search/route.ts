// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import getAdminSupabase from "../../../src/lib/serverSupabase";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");

    if (!dateParam) {
      return NextResponse.json(
        { error: "Missing date parameter" },
        { status: 400 }
      );
    }

    const start = new Date(dateParam + "T00:00:00Z");
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const supabase = getAdminSupabase();

    const { data, error } = await supabase
      .from("booking")
      .select(`
        booking_id,
        starts_at,
        ends_at,
        facility:facility(
          facility_id,
          title,
          capacity,
          description,
          facility_type
        )
      `)
      .gte("starts_at", start.toISOString())
      .lt("starts_at", end.toISOString())
      .eq("role", "available")
      .order("starts_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    const grouped: Record<
      string,
      {
        facility_id: string;
        title: string;
        capacity?: string | null;
        description?: string | null;
        facility_type?: string | null;
        slots: { booking_id: string; starts_at: string; ends_at: string | null }[];
      }
    > = {};

    for (const row of data ?? []) {
      const f = row.facility as any;
      if (!f) continue;

      if (!grouped[f.facility_id]) {
        grouped[f.facility_id] = {
          facility_id: f.facility_id,
          title: f.title,
          capacity: f.capacity,
          description: f.description,
          facility_type: f.facility_type,
          slots: [],
        };
      }

      grouped[f.facility_id].slots.push({
        booking_id: row.booking_id,
        starts_at: row.starts_at,
        ends_at: row.ends_at,
      });
    }

    const facilities = Object.values(grouped);
    return NextResponse.json(facilities, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
