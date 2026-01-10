"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import GameLobby from "./components/GameLobby";
import GameScreen from "./components/GameScreen";
import { GameRoom } from "./types";

export default function HomeClient() {
  const searchParams = useSearchParams();
  const roomIdFromUrl = searchParams.get("room");

  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinRoom = async (roomId: string, name?: string) => {
    const nameToUse = name || playerName.trim();
    if (!nameToUse) {
      setError("Please enter your name");
      return;
    }

    if (!playerId) {
      setError("Player ID not ready");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          roomId,
          playerId,
          playerName: nameToUse,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join room");
      }

      localStorage.setItem("playerName", nameToUse);
      setGameRoom(data.room);
    } catch (error: any) {
      console.error("Error joining room:", error);
      setError(error.message || "Failed to join room");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Generate a unique player ID on mount
    const storedPlayerId = localStorage.getItem("playerId");
    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
    } else {
      const newPlayerId = `player_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      setPlayerId(newPlayerId);
      localStorage.setItem("playerId", newPlayerId);
    }

    // Check if joining a room from URL
    if (roomIdFromUrl) {
      const storedName = localStorage.getItem("playerName");
      if (storedName) {
        setPlayerName(storedName);
        // Auto-join room after player ID is set
        const checkAndJoin = () => {
          const currentPlayerId = localStorage.getItem("playerId");
          if (currentPlayerId) {
            setTimeout(() => {
              joinRoom(roomIdFromUrl, storedName);
            }, 100);
          } else {
            setTimeout(checkAndJoin, 100);
          }
        };
        checkAndJoin();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomIdFromUrl]);

  // Poll for game state updates
  useEffect(() => {
    if (!gameRoom) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/rooms?roomId=${gameRoom.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.room) {
            setGameRoom(data.room);
          }
        }
      } catch (error) {
        console.error("Error polling room:", error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [gameRoom?.id]);

  const createRoom = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!playerId) {
      setError("Player ID not ready");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          playerId,
          playerName: playerName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create room");
      }

      localStorage.setItem("playerName", playerName.trim());
      setGameRoom(data.room);
    } catch (error: any) {
      console.error("Error creating room:", error);
      setError(error.message || "Failed to create room");
    } finally {
      setIsLoading(false);
    }
  };

  const addPlayer = async (name: string) => {
    if (!gameRoom) return;

    // For now, we'll use the join endpoint with a new player ID
    // In a real app, you might want a separate endpoint for adding players
    const newPlayerId = `player_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          roomId: gameRoom.id,
          playerId: newPlayerId,
          playerName: name.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok && data.room) {
        setGameRoom(data.room);
      }
    } catch (error) {
      console.error("Error adding player:", error);
    }
  };

  const startGame = async (gameType: "dota2" | "clashroyale") => {
    if (!gameRoom || gameRoom.players.length < 3) {
      setError("You need at least 3 players to start the game!");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms/${gameRoom.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          gameType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start game");
      }

      setGameRoom(data.room);
    } catch (error: any) {
      console.error("Error starting game:", error);
      setError(error.message || "Failed to start game");
    } finally {
      setIsLoading(false);
    }
  };

  const submitClue = async (clue: string) => {
    if (!gameRoom) return;

    try {
      const response = await fetch(`/api/rooms/${gameRoom.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submitClue",
          playerId,
          clue: clue.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok && data.room) {
        setGameRoom(data.room);
      }
    } catch (error) {
      console.error("Error submitting clue:", error);
    }
  };

  const vote = async (targetPlayerId: string) => {
    if (!gameRoom) return;

    try {
      const response = await fetch(`/api/rooms/${gameRoom.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "vote",
          playerId,
          targetPlayerId,
        }),
      });

      const data = await response.json();
      if (response.ok && data.room) {
        setGameRoom(data.room);
      }
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const resetGame = async () => {
    if (!gameRoom) return;

    try {
      const response = await fetch(`/api/rooms/${gameRoom.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset",
        }),
      });

      const data = await response.json();
      if (response.ok && data.room) {
        setGameRoom(data.room);
      }
    } catch (error) {
      console.error("Error resetting game:", error);
    }
  };

  if (!gameRoom) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900">
          <h1 className="mb-2 text-3xl font-bold text-center text-black dark:text-zinc-50">
            Imposter Game
          </h1>
          <p className="mb-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Play with Dota 2 Heroes or Clash Royale Cards
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-black focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    if (roomIdFromUrl) {
                      joinRoom(roomIdFromUrl);
                    } else {
                      createRoom();
                    }
                  }
                }}
                disabled={isLoading}
              />
            </div>

            {roomIdFromUrl ? (
              <button
                onClick={() => joinRoom(roomIdFromUrl)}
                disabled={isLoading || !playerName.trim()}
                className="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Joining..." : "Join Room"}
              </button>
            ) : (
              <button
                onClick={createRoom}
                disabled={isLoading || !playerName.trim()}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Creating..." : "Create Room"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameRoom.gameState === "lobby") {
    return (
      <GameLobby
        gameRoom={gameRoom}
        playerId={playerId}
        playerName={playerName}
        onAddPlayer={addPlayer}
        onStartGame={startGame}
      />
    );
  }

  return (
    <GameScreen
      gameRoom={gameRoom}
      playerId={playerId}
      playerName={playerName}
      onSubmitClue={submitClue}
      onVote={vote}
      onResetGame={resetGame}
    />
  );
}
