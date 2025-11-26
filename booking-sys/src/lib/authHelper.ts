// src/lib/authHelper.ts
import getAdminSupabase from "./serverSupabase";

export async function getCurrentUserWithRole() {
  const supabase = getAdminSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, role: null as "student" | "teacher" | null };
  }

  const { data: userlistRow } = await supabase
    .from("userlist")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role =
    (userlistRow?.role as "student" | "teacher" | undefined) ?? "student";

  return { user, role };
}
