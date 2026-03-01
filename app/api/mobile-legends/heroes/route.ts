import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getSupabaseServer } from "../../../lib/supabaseServer";

export interface MobileLegendsHero {
  id: string;
  uid: string;
  name: string;
  hero_class: string;
  portrait: string;
  laning?: string[];
  speciality?: string[];
}

interface RawHero {
  hero_name: string;
  uid: string;
  id: string;
  portrait: string;
  class: string;
  laning?: string[];
  speciality?: string[];
}

function loadFromJson(): MobileLegendsHero[] {
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    "hero-meta-final.json"
  );
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(fileContent);
  const rawData: RawHero[] = json.data || [];

  return rawData
    .filter(
      (h) =>
        h.hero_name &&
        h.hero_name !== "None" &&
        h.uid &&
        h.uid !== "null" &&
        h.portrait
    )
    .map((h) => ({
      id: h.id || h.uid,
      uid: h.uid,
      name: h.hero_name,
      hero_class: h.class || "Unknown",
      portrait: h.portrait,
      laning: h.laning,
      speciality: h.speciality,
    }));
}

export async function GET() {
  try {
    // Try Supabase first (cached)
    const supabase = await getSupabaseServer();

    if (supabase) {
      const { data, error } = await supabase
        .from("mobile_legends_heroes")
        .select("data")
        .order("id");

      if (!error && data && data.length > 0) {
        console.log(
          `✅ Returning ${data.length} Mobile Legends heroes from Supabase cache`
        );
        return Response.json({
          items: data.map((row) => row.data),
        });
      }

      if (error) {
        console.warn(
          "⚠️  Supabase query error (will try JSON):",
          error.message
        );
      } else {
        console.log(
          "ℹ️  No Mobile Legends heroes in database (will load from JSON)"
        );
      }
    }

    // Fallback to JSON file
    const heroes = loadFromJson();
    return Response.json({ items: heroes });
  } catch (error) {
    console.error("Error fetching Mobile Legends heroes:", error);
    return Response.json(
      { error: "Failed to fetch Mobile Legends heroes" },
      { status: 500 }
    );
  }
}
