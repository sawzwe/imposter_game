import { NextRequest, NextResponse } from "next/server";
import { getRoom, updateRoom } from "../../../lib/gameStore";
import { GameRoom, Hero } from "../../../types";

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const room = await getRoom(params.roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    return NextResponse.json({ room });
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const body = await request.json();
    const { action, playerId, clue, targetPlayerId } = body;

    const room = await getRoom(params.roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (action === "start") {
      if (room.players.length < 3) {
        return NextResponse.json(
          { error: "Need at least 3 players" },
          { status: 400 }
        );
      }

      // Fetch heroes
      const heroesResponse = await fetch(
        `${request.nextUrl.origin}/api/heroes`
      );
      const heroesData = await heroesResponse.json();
      const heroes: Hero[] = heroesData.result.data.heroes;

      // Select random hero
      const randomHero = heroes[Math.floor(Math.random() * heroes.length)];

      // Randomly select imposter
      const imposterIndex = Math.floor(Math.random() * room.players.length);
      const updatedPlayers = room.players.map((player, index) => ({
        ...player,
        isImposter: index === imposterIndex,
        hero: index === imposterIndex ? undefined : randomHero,
        hasSubmittedClue: false,
        clue: undefined,
      }));

      const updatedRoom = await updateRoom(params.roomId, {
        players: updatedPlayers,
        currentHero: randomHero,
        gameState: "playing",
        clues: [],
        votes: [],
      });

      return NextResponse.json({ room: updatedRoom });
    }

    if (action === "submitClue") {
      if (!playerId || !clue) {
        return NextResponse.json(
          { error: "Player ID and clue are required" },
          { status: 400 }
        );
      }

      const updatedPlayers = room.players.map((player) =>
        player.id === playerId
          ? { ...player, clue, hasSubmittedClue: true }
          : player
      );

      const updatedClues = [
        ...room.clues.filter((c) => c.playerId !== playerId),
        { playerId, clue },
      ];

      const allSubmitted = updatedPlayers.every((p) => p.hasSubmittedClue);

      const updatedRoom = await updateRoom(params.roomId, {
        players: updatedPlayers,
        clues: updatedClues,
        gameState: allSubmitted ? "voting" : room.gameState,
      });

      return NextResponse.json({ room: updatedRoom });
    }

    if (action === "vote") {
      if (!playerId || !targetPlayerId) {
        return NextResponse.json(
          { error: "Player ID and target player ID are required" },
          { status: 400 }
        );
      }

      const updatedVotes = [
        ...room.votes.filter((v) => v.voterId !== playerId),
        { voterId: playerId, targetId: targetPlayerId },
      ];

      const allVoted = room.players.every((player) =>
        updatedVotes.some((v) => v.voterId === player.id)
      );

      const updatedRoom = await updateRoom(params.roomId, {
        votes: updatedVotes,
        gameState: allVoted ? "finished" : room.gameState,
      });

      return NextResponse.json({ room: updatedRoom });
    }

    if (action === "reset") {
      const updatedRoom = await updateRoom(params.roomId, {
        gameState: "lobby",
        round: 1,
        clues: [],
        votes: [],
        currentHero: undefined,
        players: room.players.map((p) => ({
          ...p,
          isImposter: false,
          hero: undefined,
          clue: undefined,
          hasSubmittedClue: false,
        })),
      });

      return NextResponse.json({ room: updatedRoom });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
