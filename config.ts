// Centralized configuration for API keys and settings
// This file can be used to manage all API keys in one place

export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },
  clashRoyale: {
    apiKey: process.env.CLASH_ROYALE_API_KEY || "",
  },
  useSupabase: process.env.USE_SUPABASE === "true",
};

// Validation helpers
export function validateSupabaseConfig(): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!config.supabase.url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!config.supabase.serviceRoleKey)
    missing.push("SUPABASE_SERVICE_ROLE_KEY");

  return {
    valid: missing.length === 0,
    missing,
  };
}

export function validateClashRoyaleConfig(): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!config.clashRoyale.apiKey) missing.push("CLASH_ROYALE_API_KEY");

  return {
    valid: missing.length === 0,
    missing,
  };
}
