import { NextRequest, NextResponse } from "next/server";
import { getRoom, updateRoom } from "../../../lib/gameStore";
import {
  GameRoom,
  Hero,
  ClashRoyaleCard,
  GameType,
  GameHint,
} from "../../../types";
import {
  sanitizeClue,
  validatePlayerId,
  validateRoomId,
} from "../../../lib/validation";

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

    // Validate room ID format
    if (!validateRoomId(roomId)) {
      return NextResponse.json(
        { error: "Invalid room ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, playerId, clue, targetPlayerId, gameType } = body;

    // Validate player ID if provided
    if (playerId && !validatePlayerId(playerId)) {
      return NextResponse.json(
        { error: "Invalid player ID format" },
        { status: 400 }
      );
    }

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
        hints = [{ type: "Elixir Cost", value: `${randomCard.elixirCost}` }];

        // Add rarity hint if available
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
        hints: room.hintsEnabled !== false ? hints : [], // Only set hints if enabled
        gameState: "playing",
        clues: [],
        votes: [],
        hintsEnabled: room.hintsEnabled !== false, // Default to true if not set
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

      // Validate player is in room
      const player = room.players.find((p) => p.id === playerId);
      if (!player) {
        return NextResponse.json(
          { error: "Player not found in room" },
          { status: 404 }
        );
      }

      // Sanitize clue
      const sanitizedClue = sanitizeClue(clue);
      if (!sanitizedClue) {
        return NextResponse.json(
          { error: "Clue cannot be empty" },
          { status: 400 }
        );
      }

      const updatedPlayers = room.players.map((p) =>
        p.id === playerId
          ? { ...p, clue: sanitizedClue, hasSubmittedClue: true }
          : p
      );

      const updatedClues = [
        ...room.clues.filter((c) => c.playerId !== playerId),
        { playerId, clue: sanitizedClue },
      ];

      const allSubmitted = updatedPlayers.every((p) => p.hasSubmittedClue);

      const updatedRoom = await updateRoom(roomId, {
        players: updatedPlayers,
        clues: updatedClues,
        gameState: allSubmitted ? "voting" : room.gameState,
        votingStartTime: allSubmitted ? Date.now() : room.votingStartTime,
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

      // Validate both player IDs
      if (!validatePlayerId(playerId) || !validatePlayerId(targetPlayerId)) {
        return NextResponse.json(
          { error: "Invalid player ID format" },
          { status: 400 }
        );
      }

      // Validate voter is in room
      const voter = room.players.find((p) => p.id === playerId);
      if (!voter) {
        return NextResponse.json(
          { error: "Voter not found in room" },
          { status: 404 }
        );
      }

      // Validate target is in room
      const target = room.players.find((p) => p.id === targetPlayerId);
      if (!target) {
        return NextResponse.json(
          { error: "Target player not found in room" },
          { status: 404 }
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

    if (action === "skip") {
      if (!playerId) {
        return NextResponse.json(
          { error: "Player ID is required" },
          { status: 400 }
        );
      }

      // Only host can skip (first player)
      const isHost = room.players[0]?.id === playerId;
      if (!isHost) {
        return NextResponse.json(
          { error: "Only the host can skip phases" },
          { status: 403 }
        );
      }

      // Skip to next phase based on current state
      if (room.gameState === "playing") {
        // Skip to voting phase
        const updatedRoom = await updateRoom(roomId, {
          gameState: "voting",
          votingStartTime: Date.now(),
        });
        return NextResponse.json({ room: updatedRoom });
      } else if (room.gameState === "voting") {
        // Skip to finished phase - determine who was voted out
        const voteCounts: { [key: string]: number } = {};
        room.votes.forEach((vote) => {
          voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
        });

        // Find most voted player, or first player if no votes
        const mostVoted = Object.entries(voteCounts).sort(
          ([, a], [, b]) => b - a
        )[0];
        const votedOutId = mostVoted ? mostVoted[0] : room.players[0]?.id;

        const updatedRoom = await updateRoom(roomId, {
          gameState: "finished",
        });
        return NextResponse.json({ room: updatedRoom });
      }

      return NextResponse.json(
        { error: "Cannot skip from current state" },
        { status: 400 }
      );
    }

    if (action === "nextRound") {
      if (!playerId) {
        return NextResponse.json(
          { error: "Player ID is required" },
          { status: 400 }
        );
      }

      // Only host can start next round
      const isHost = room.players[0]?.id === playerId;
      if (!isHost) {
        return NextResponse.json(
          { error: "Only the host can start the next round" },
          { status: 403 }
        );
      }

      // Reset for next round but keep players and game type
      const updatedRoom = await updateRoom(roomId, {
        gameState: "playing",
        round: room.round + 1,
        clues: [],
        votes: [],
        votingStartTime: undefined,
        currentHero: undefined,
        currentCard: undefined,
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

      // Start the game automatically (assign new imposter and hero/card)
      const selectedGameType = room.gameType || "dota2";
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
        hints = [{ type: "Elixir Cost", value: `${randomCard.elixirCost}` }];

        // Add rarity hint if available
        if (randomCard.rarity) {
          hints.push({ type: "Rarity", value: randomCard.rarity });
        }
      }

      // Randomly select new imposter
      const imposterIndex = Math.floor(
        Math.random() * updatedRoom!.players.length
      );
      const finalPlayers = updatedRoom!.players.map((player, index) => ({
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
      }));

      const finalRoom = await updateRoom(roomId, {
        players: finalPlayers,
        currentHero: randomHero,
        currentCard: randomCard,
        hints: room.hintsEnabled !== false ? hints : [], // Only set hints if enabled
      });

      return NextResponse.json({ room: finalRoom });
    }

    if (action === "toggleHints") {
      if (!playerId) {
        return NextResponse.json(
          { error: "Player ID is required" },
          { status: 400 }
        );
      }

      // Only host can toggle hints
      const isHost = room.players[0]?.id === playerId;
      if (!isHost) {
        return NextResponse.json(
          { error: "Only the host can toggle hints" },
          { status: 403 }
        );
      }

      const updatedRoom = await updateRoom(roomId, {
        hintsEnabled: room.hintsEnabled === false ? true : false,
      });

      return NextResponse.json({ room: updatedRoom });
    }

    if (action === "kickPlayer") {
      if (!playerId || !targetPlayerId) {
        return NextResponse.json(
          { error: "Player ID and target player ID are required" },
          { status: 400 }
        );
      }

      // Only host can kick players
      const isHost = room.players[0]?.id === playerId;
      if (!isHost) {
        return NextResponse.json(
          { error: "Only the host can kick players" },
          { status: 403 }
        );
      }

      // Cannot kick yourself
      if (playerId === targetPlayerId) {
        return NextResponse.json(
          { error: "Cannot kick yourself" },
          { status: 400 }
        );
      }

      // Cannot kick the host
      if (targetPlayerId === room.players[0]?.id) {
        return NextResponse.json(
          { error: "Cannot kick the host" },
          { status: 400 }
        );
      }

      // Remove player from room
      const updatedPlayers = room.players.filter(
        (p) => p.id !== targetPlayerId
      );

      const updatedRoom = await updateRoom(roomId, {
        players: updatedPlayers,
      });

      return NextResponse.json({ room: updatedRoom });
    }

    if (action === "reset") {
      const updatedRoom = await updateRoom(roomId, {
        gameState: "lobby",
        round: 1,
        clues: [],
        votes: [],
        votingStartTime: undefined,
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
