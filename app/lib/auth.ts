import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseServer } from "./supabaseServer";
import type { User } from "@supabase/supabase-js";

/**
 * Reads session from cookies using @supabase/ssr.
 * Returns the current user or null.
 */
export async function getUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignored if called from Server Component (read-only)
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Gets the current user and verifies they have is_admin = true in profiles.
 * Returns the user if admin, null otherwise.
 */
export async function requireAdmin(): Promise<User | null> {
  const user = await getUser();
  if (!user) return null;

  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (error || !profile?.is_admin) {
    return null;
  }

  return user;
}
