import { NextRequest, NextResponse } from "next/server";
import { getRoom, updateRoom } from "../../../lib/gameStore";
import {
  GameRoom,
  Hero,
  ClashRoyaleCard,
  GameType,
  GameHint,
} from "../../../types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const room = await getRoom(roomId);
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
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { action, playerId, clue, targetPlayerId, gameType } = body;

    const room = await getRoom(roomId);
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

      const selectedGameType: GameType = gameType || "dota2";
      let hints: GameHint[] = [];
      let randomHero: Hero | undefined;
      let randomCard: ClashRoyaleCard | undefined;

      if (selectedGameType === "dota2") {
        // Fetch Dota 2 heroes
        const heroesResponse = await fetch(
          `${request.nextUrl.origin}/api/heroes`
        );

        if (!heroesResponse.ok) {
          throw new Error("Failed to fetch Dota 2 heroes");
        }

        const heroesData = await heroesResponse.json();
        const heroes: Hero[] = heroesData.result?.data?.heroes || [];

        if (heroes.length === 0) {
          throw new Error("No heroes available");
        }

        // Select random hero
        randomHero = heroes[Math.floor(Math.random() * heroes.length)];

        // Generate hints for imposter
        hints = [
          {
            type: "Primary Attribute",
            value:
              ["Strength", "Agility", "Intelligence"][
                randomHero.primary_attr
              ] || "Unknown",
          },
          { type: "Complexity", value: `${randomHero.complexity}/3` },
        ];
      } else if (selectedGameType === "clashroyale") {
        // Fetch Clash Royale cards
        const cardsResponse = await fetch(
          `${request.nextUrl.origin}/api/clash-royale/cards`
        );

        if (!cardsResponse.ok) {
          const errorData = await cardsResponse.json().catch(() => ({}));
          const errorMessage =
            errorData.error ||
            errorData.message ||
            "Failed to fetch Clash Royale cards";

          // Provide helpful context
          if (cardsResponse.status === 403) {
            throw new Error(
              `${errorMessage}. Your IP address may not be whitelisted. Check your Clash Royale API key settings.`
            );
          }

          throw new Error(errorMessage);
        }

        const cardsData = await cardsResponse.json();
        const cards: ClashRoyaleCard[] = cardsData.items || [];

        if (cards.length === 0) {
          throw new Error(
            "No cards available. Check your Clash Royale API key."
          );
        }

        // Select random card
        randomCard = cards[Math.floor(Math.random() * cards.length)];

        // Generate hints for imposter
        hints = [
          { type: "Elixir Cost", value: `${randomCard.elixirCost}` },
          { type: "Max Level", value: `${randomCard.maxLevel}` },
        ];

        // Add rarity hint if available (rarity might be in different field)
        if (randomCard.rarity) {
          hints.push({ type: "Rarity", value: randomCard.rarity });
        }
      }

      // Randomly select imposter
      const imposterIndex = Math.floor(Math.random() * room.players.length);
      const updatedPlayers = room.players.map((player, index) => ({
        ...player,
        isImposter: index === imposterIndex,
        hero:
          selectedGameType === "dota2" && index !== imposterIndex
            ? randomHero
            : undefined,
        card:
          selectedGameType === "clashroyale" && index !== imposterIndex
            ? randomCard
            : undefined,
        hasSubmittedClue: false,
        clue: undefined,
      }));

      const updatedRoom = await updateRoom(roomId, {
        players: updatedPlayers,
        currentHero: randomHero,
        currentCard: randomCard,
        gameType: selectedGameType,
        hints,
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

      const updatedRoom = await updateRoom(roomId, {
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

      const updatedRoom = await updateRoom(roomId, {
        votes: updatedVotes,
        gameState: allVoted ? "finished" : room.gameState,
      });

      return NextResponse.json({ room: updatedRoom });
    }

    if (action === "reset") {
      const updatedRoom = await updateRoom(roomId, {
        gameState: "lobby",
        round: 1,
        clues: [],
        votes: [],
        currentHero: undefined,
        currentCard: undefined,
        gameType: undefined,
        hints: undefined,
        players: room.players.map((p) => ({
          ...p,
          isImposter: false,
          hero: undefined,
          card: undefined,
          clue: undefined,
          hasSubmittedClue: false,
        })),
      });

      return NextResponse.json({ room: updatedRoom });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating room:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
