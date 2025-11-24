// src/app/api/facility/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../src/lib/serverSupabase";

export async function GET() {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("facility")
    .select("*")
    .order("title", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch facilities", details: error },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 200 });
}
