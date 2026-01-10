import { getSupabaseClient } from "../../lib/supabaseClient";

export async function GET() {
  try {
    // Try to get heroes from Supabase first (cached)
    const supabase = await getSupabaseClient();

    if (supabase) {
      const { data, error } = await supabase
        .from("dota_heroes")
        .select("data")
        .order("id");

      if (!error && data && data.length > 0) {
        console.log(`✅ Returning ${data.length} heroes from Supabase cache`);
        return Response.json({
          result: {
            data: {
              heroes: data.map((row) => row.data),
            },
          },
        });
      }

      if (error) {
        console.warn("⚠️  Supabase query error (will try API):", error.message);
      } else {
        console.log("ℹ️  No heroes in database (will fetch from API)");
      }
    }

    // Fallback to API if database is empty or Supabase not configured
    const response = await fetch(
      "https://www.dota2.com/datafeed/herolist?language=english",
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch heroes");
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Error fetching heroes:", error);
    return Response.json({ error: "Failed to fetch heroes" }, { status: 500 });
  }
}
