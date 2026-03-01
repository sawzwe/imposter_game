import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { existsSync, readFileSync } from "fs";

// Load env vars from .env.local first, then .env
const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");

if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  console.log("📁 Loaded .env.local");
} else if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log("📁 Loaded .env");
} else {
  console.warn("⚠️  No .env.local or .env file found, using process.env");
}

// Read config from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const clashRoyaleApiKey = process.env.CLASH_ROYALE_API_KEY || "";

// Validate Supabase config
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase credentials not found");
  const missing: string[] = [];
  if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  console.error(`   Missing: ${missing.join(", ")}`);
  console.error("   Check your .env or .env.local file");
  process.exit(1);
}

// Validate Clash Royale config (optional)
if (!clashRoyaleApiKey) {
  console.warn("⚠️  CLASH_ROYALE_API_KEY not found");
  console.warn("   Clash Royale cards will not be synced");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncClashRoyaleCards() {
  if (!clashRoyaleApiKey) {
    console.log("⏭️  Skipping Clash Royale cards (no API key)");
    return;
  }

  console.log("🔄 Fetching Clash Royale cards from API...");

  try {
    // Fetch all cards (handle pagination if needed)
    const response = await fetch("https://api.clashroyale.com/v1/cards", {
      headers: {
        Authorization: `Bearer ${clashRoyaleApiKey}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const cards = data.items || [];

    if (cards.length === 0) {
      throw new Error("No cards returned from API");
    }

    console.log(`✅ Fetched ${cards.length} cards`);

    // Clear existing cards
    const { error: deleteError } = await supabase
      .from("clash_royale_cards")
      .delete()
      .neq("id", 0);

    if (deleteError) {
      console.warn("⚠️  Warning clearing cards:", deleteError.message);
    } else {
      console.log("🗑️  Cleared existing cards");
    }

    // Insert all cards in batches
    const batchSize = 50;
    for (let i = 0; i < cards.length; i += batchSize) {
      const batch = cards.slice(i, i + batchSize);
      const cardsToInsert = batch.map((card: any) => ({
        id: card.id,
        data: card,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("clash_royale_cards")
        .insert(cardsToInsert);

      if (error) {
        throw error;
      }
    }

    console.log(`✅ Stored ${cards.length} cards in Supabase`);
  } catch (error: any) {
    console.error("❌ Error syncing Clash Royale cards:", error.message);
    throw error;
  }
}

async function syncMobileLegendsHeroes() {
  console.log("🔄 Loading Mobile Legends heroes from hero-meta-final.json...");

  try {
    const filePath = resolve(process.cwd(), "public", "data", "hero-meta-final.json");
    if (!existsSync(filePath)) {
      throw new Error("hero-meta-final.json not found in public/data/");
    }

    const fileContent = readFileSync(filePath, "utf-8");
    const json = JSON.parse(fileContent);
    const rawData: any[] = json.data || [];

    const heroes = rawData
      .filter(
        (h: any) =>
          h.hero_name &&
          h.hero_name !== "None" &&
          h.uid &&
          h.uid !== "null" &&
          h.portrait
      )
      .map((h: any) => ({
        id: h.id || h.uid,
        uid: h.uid,
        name: h.hero_name,
        hero_class: h.class || "Unknown",
        portrait: h.portrait,
        laning: h.laning,
        speciality: h.speciality,
      }));

    if (heroes.length === 0) {
      throw new Error("No valid heroes in JSON");
    }

    console.log(`✅ Loaded ${heroes.length} heroes`);

    // Clear existing heroes
    const { error: deleteError } = await supabase
      .from("mobile_legends_heroes")
      .delete()
      .neq("id", 0);

    if (deleteError) {
      console.warn("⚠️  Warning clearing heroes:", deleteError.message);
    } else {
      console.log("🗑️  Cleared existing Mobile Legends heroes");
    }

    // Insert all heroes in batches
    const batchSize = 50;
    for (let i = 0; i < heroes.length; i += batchSize) {
      const batch = heroes.slice(i, i + batchSize);
      const heroesToInsert = batch.map((hero: any) => ({
        data: hero,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("mobile_legends_heroes")
        .insert(heroesToInsert);

      if (error) {
        throw error;
      }
    }

    console.log(`✅ Stored ${heroes.length} heroes in Supabase`);
  } catch (error: any) {
    console.error("❌ Error syncing Mobile Legends heroes:", error.message);
    throw error;
  }
}

async function syncDotaHeroes() {
  console.log("🔄 Fetching Dota 2 heroes from API...");

  try {
    const response = await fetch(
      "https://www.dota2.com/datafeed/herolist?language=english"
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const heroes = data.result?.data?.heroes || [];

    if (heroes.length === 0) {
      throw new Error("No heroes returned from API");
    }

    console.log(`✅ Fetched ${heroes.length} heroes`);

    // Clear existing heroes
    const { error: deleteError } = await supabase
      .from("dota_heroes")
      .delete()
      .neq("id", 0);

    if (deleteError) {
      console.warn("⚠️  Warning clearing heroes:", deleteError.message);
    } else {
      console.log("🗑️  Cleared existing heroes");
    }

    // Insert all heroes in batches
    const batchSize = 50;
    for (let i = 0; i < heroes.length; i += batchSize) {
      const batch = heroes.slice(i, i + batchSize);
      const heroesToInsert = batch.map((hero: any) => ({
        id: hero.id,
        data: hero,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("dota_heroes")
        .insert(heroesToInsert);

      if (error) {
        throw error;
      }
    }

    console.log(`✅ Stored ${heroes.length} heroes in Supabase`);
  } catch (error: any) {
    console.error("❌ Error syncing Dota heroes:", error.message);
    throw error;
  }
}

async function main() {
  console.log("🚀 Starting card sync...\n");

  try {
    const results = await Promise.allSettled([
      syncClashRoyaleCards(),
      syncDotaHeroes(),
      syncMobileLegendsHeroes(),
    ]);

    const names = ["Clash Royale", "Dota 2", "Mobile Legends"];
    const hasErrors = results.some((r) => r.status === "rejected");

    if (hasErrors) {
      console.log("\n⚠️  Some syncs failed, but continuing...");
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(`  - ${names[index]}: ${result.reason}`);
        }
      });
    }

    console.log("\n✅ Sync complete!");
    console.log("💡 Cards are now cached in Supabase and will work on Vercel!");
  } catch (error) {
    console.error("\n❌ Sync failed:", error);
    process.exit(1);
  }
}

main();
