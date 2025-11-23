import { NextRequest, NextResponse } from "next/server";
import { createRoom, getRoom, addPlayerToRoom } from "../../lib/gameStore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, roomId, playerId, playerName } = body;

    if (action === "create") {
      if (!playerId || !playerName) {
        return NextResponse.json(
          { error: "Player ID and name are required" },
          { status: 400 }
        );
      }

      const newRoomId = `room_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const room = await createRoom(newRoomId, { id: playerId, name: playerName });
      return NextResponse.json({ room });
    }

    if (action === "join") {
      if (!roomId || !playerId || !playerName) {
        return NextResponse.json(
          { error: "Room ID, player ID, and name are required" },
          { status: 400 }
        );
      }

      const room = await getRoom(roomId);
      if (!room) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      }

      // Check if player already in room
      if (room.players.some((p) => p.id === playerId)) {
        return NextResponse.json({ room });
      }

      // Add player to room
      const updatedRoom = await addPlayerToRoom(roomId, {
        id: playerId,
        name: playerName,
      });
      if (!updatedRoom) {
        return NextResponse.json(
          { error: "Failed to join room" },
          { status: 500 }
        );
      }

      return NextResponse.json({ room: updatedRoom });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in rooms API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
    }

    console.log("Fetching room:", roomId);
    const room = await getRoom(roomId);
    
    if (!room) {
      console.log("Room not found:", roomId);
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    console.log("Room found:", room.id);
    return NextResponse.json({ room });
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
