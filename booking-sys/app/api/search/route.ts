import { NextRequest, NextResponse } from "next/server";
import adminSupabase from "../../../src/lib/serverSupabase";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");
    if (!dateParam) {
      return NextResponse.json({ error: "Missing date parameter" }, { status: 400 });
    }

    // accept YYYY-MM-DD; treat as UTC midnight for simplicity
    const start = new Date(dateParam + "T00:00:00Z");
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const supabase = adminSupabase;

    const { data, error } = await supabase
      .from("booking")
      .select(`
        booking_id,
        starts_at,
        ends_at,
        facility:facility(facility_id, title, capacity, description)
      `)
      .gte("starts_at", start.toISOString())
      .lt("starts_at", end.toISOString())
      .eq("role", "available")
      .order("starts_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    // group by facility
    const grouped: Record<string, any> = {};
    for (const row of data as any[]) {
      const f = row.facility;
      if (!f) continue;
      if (!grouped[f.facility_id]) {
        grouped[f.facility_id] = { facility_id: f.facility_id, title: f.title, capacity: f.capacity, description: f.description, slots: [] };
      }
      grouped[f.facility_id].slots.push({ booking_id: row.booking_id, starts_at: row.starts_at, ends_at: row.ends_at });
    }

    const result = Object.values(grouped);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
