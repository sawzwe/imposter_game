import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

export async function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (supabaseClient) {
    return supabaseClient;
  }

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return null;
    }

    const { createClient: createSupabaseClient } = await import(
      "@supabase/supabase-js"
    );
    supabaseClient = createSupabaseClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    return supabaseClient;
  } catch (error) {
    console.error("Error creating Supabase client:", error);
    return null;
  }
}
