import { NextRequest, NextResponse } from "next/server";
import {
  createRoom,
  getRoom,
  addPlayerToRoom,
  updateRoom,
} from "../../lib/gameStore";
import {
  sanitizePlayerName,
  validateRoomCode,
  validatePlayerId,
  validateRoomId,
} from "../../lib/validation";

// Generate a short, user-friendly room code (6 characters, uppercase)
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars like 0, O, I, 1
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, roomId, roomCode, playerId, playerName } = body;

    if (action === "create") {
      if (!playerId || !playerName) {
        return NextResponse.json(
          { error: "Player ID and name are required" },
          { status: 400 }
        );
      }

      // Validate player ID
      if (!validatePlayerId(playerId)) {
        return NextResponse.json(
          { error: "Invalid player ID format" },
          { status: 400 }
        );
      }

      // Sanitize player name
      const sanitizedName = sanitizePlayerName(playerName);
      if (!sanitizedName) {
        return NextResponse.json(
          { error: "Player name cannot be empty" },
          { status: 400 }
        );
      }

      // Generate short room code
      const roomCode = generateRoomCode();
      const newRoomId = `room_${roomCode}`;
      const room = await createRoom(newRoomId, {
        id: playerId,
        name: sanitizedName,
      });
      return NextResponse.json({ room, roomCode });
    }

    if (action === "join") {
      if ((!roomId && !roomCode) || !playerId || !playerName) {
        return NextResponse.json(
          { error: "Room code/ID, player ID, and name are required" },
          { status: 400 }
        );
      }

      // Validate player ID
      if (!validatePlayerId(playerId)) {
        return NextResponse.json(
          { error: "Invalid player ID format" },
          { status: 400 }
        );
      }

      // Validate room code if provided
      if (roomCode && !validateRoomCode(roomCode)) {
        return NextResponse.json(
          { error: "Invalid room code format" },
          { status: 400 }
        );
      }

      // Validate room ID if provided
      if (roomId && !validateRoomId(roomId)) {
        return NextResponse.json(
          { error: "Invalid room ID format" },
          { status: 400 }
        );
      }

      // Sanitize player name
      const sanitizedName = sanitizePlayerName(playerName);
      if (!sanitizedName) {
        return NextResponse.json(
          { error: "Player name cannot be empty" },
          { status: 400 }
        );
      }

      // Support both roomId and roomCode
      let actualRoomId = roomId;
      if (roomCode && !roomId) {
        actualRoomId = `room_${roomCode.toUpperCase()}`;
      }

      const room = await getRoom(actualRoomId);
      if (!room) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      }

      // Check room capacity (max 10 players)
      if (room.players.length >= 10) {
        return NextResponse.json(
          { error: "Room is full (maximum 10 players)" },
          { status: 400 }
        );
      }

      // Check if player already in room
      const existingPlayer = room.players.find((p) => p.id === playerId);
      if (existingPlayer) {
        // If player exists but name changed, update the name
        if (existingPlayer.name !== sanitizedName) {
          const updatedPlayers = room.players.map((p) =>
            p.id === playerId ? { ...p, name: sanitizedName } : p
          );
          const updatedRoom = {
            ...room,
            players: updatedPlayers,
          };
          // Update room with new name
          const savedRoom = await updateRoom(actualRoomId, updatedRoom);
          return NextResponse.json({ room: savedRoom || updatedRoom });
        }
        return NextResponse.json({ room });
      }

      // Add player to room
      const updatedRoom = await addPlayerToRoom(actualRoomId, {
        id: playerId,
        name: sanitizedName,
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

    // Validate room ID format
    if (!validateRoomId(roomId)) {
      return NextResponse.json(
        { error: "Invalid room ID format" },
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
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
