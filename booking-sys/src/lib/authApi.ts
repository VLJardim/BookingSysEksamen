// src/lib/authApi.ts
"use client";

import getBrowserSupabase from "@/src/lib/supabase";
import { mapSupabaseAuthError } from "@/src/utils/errorMapping";
import type { ErrorKey } from "@/src/lib/errorMessages";

type UserRole = "student" | "teacher";

export type LoginResult =
  | { ok: true; role: UserRole }
  | { ok: false; errorKey: ErrorKey };

export type RegisterResult =
  | { ok: true }
  | { ok: false; errorKey: ErrorKey };

// Log brugeren ind + hent rolle fra userlist
export async function login(
  email: string,
  password: string
): Promise<LoginResult> {
  const supabase = getBrowserSupabase() as any;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false, errorKey: mapSupabaseAuthError(error) };
  }

  const user = data?.user;
  if (!user) {
    return { ok: false, errorKey: "AUTH_UNKNOWN_ERROR" };
  }

  const { data: userlistRow, error: userlistError } = await supabase
    .from("userlist")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (userlistError || !userlistRow?.role) {
    console.error("[authApi.login] Failed to load user role", userlistError);
    return { ok: false, errorKey: "AUTH_UNKNOWN_ERROR" };
  }

  return { ok: true, role: userlistRow.role as UserRole };
}

// Opret bruger – redirect-link styres fra komponenten (window.location.origin)
export type RegisterParams = {
  fullName: string;
  email: string;
  password: string;
  redirectTo: string; // fx `${window.location.origin}/login`
};

export async function register({
  fullName,
  email,
  password,
  redirectTo,
}: RegisterParams): Promise<RegisterResult> {
  const supabase = getBrowserSupabase() as any;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: redirectTo,
    } as any,
  });

  if (error) {
    return { ok: false, errorKey: mapSupabaseAuthError(error) };
  }

  return { ok: true };
}
