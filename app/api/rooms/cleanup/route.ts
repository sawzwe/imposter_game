import { NextRequest, NextResponse } from "next/server";
import { cleanupInactiveRooms } from "../../../lib/gameStore";

/**
 * Cleanup API route - deletes inactive rooms
 * Should be called periodically (e.g., via cron job or scheduled function)
 * 
 * Query params:
 * - maxAgeHours: Maximum age in hours before a room is considered inactive (default: 1)
 */
export async function POST(request: NextRequest) {
  try {
    // Only allow cleanup in production or with a secret key
    const authHeader = request.headers.get("authorization");
    const secretKey = process.env.CLEANUP_SECRET_KEY;
    
    if (secretKey && authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const maxAgeHours = parseInt(searchParams.get("maxAgeHours") || "1", 10);
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds

    const deletedCount = await cleanupInactiveRooms(maxAgeMs);

    return NextResponse.json({
      success: true,
      deletedCount,
      maxAgeHours,
      message: `Cleaned up ${deletedCount} inactive room(s)`,
    });
  } catch (error) {
    console.error("Error in cleanup API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Also support GET for easier cron job setup
export async function GET(request: NextRequest) {
  return POST(request);
}


