"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [roomCode, setRoomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract room code from roomId (format: room_XXXXXX)
  const getRoomCodeFromId = (roomId: string): string => {
    if (roomId.startsWith("room_")) {
      return roomId.replace("room_", "");
    }
    return roomId;
  };

  const leaveRoom = useCallback(() => {
    localStorage.removeItem("roomId");
    setGameRoom(null);
    setRoomCode("");
    setError(null);
    // Clear URL if it has room parameter
    if (
      typeof window !== "undefined" &&
      window.location.search.includes("room=")
    ) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const joinRoom = async (roomIdOrCode: string, name?: string) => {
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
      // Support both room ID and room code
      const isRoomCode = !roomIdOrCode.startsWith("room_");
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          ...(isRoomCode
            ? { roomCode: roomIdOrCode.toUpperCase() }
            : { roomId: roomIdOrCode }),
          playerId,
          playerName: nameToUse,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join room");
      }

      localStorage.setItem("playerName", nameToUse);
      localStorage.setItem("roomId", data.room.id);
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

    // Restore player name
    const storedName = localStorage.getItem("playerName");
    if (storedName) {
      setPlayerName(storedName);
    }

    // Try to restore session - check if user was in a room
    const storedRoomId = localStorage.getItem("roomId");
    if (storedRoomId && storedName) {
      // Try to rejoin the room
      const checkAndRejoin = async () => {
        const currentPlayerId = localStorage.getItem("playerId");
        if (currentPlayerId) {
          try {
            const response = await fetch(`/api/rooms?roomId=${storedRoomId}`);
            if (response.ok) {
              const data = await response.json();
              if (data.room) {
                // Check if player is still in the room
                const playerInRoom = data.room.players.some(
                  (p: any) => p.id === currentPlayerId
                );
                if (playerInRoom) {
                  setGameRoom(data.room);
                } else {
                  // Player not in room, try to rejoin
                  await joinRoom(storedRoomId, storedName);
                }
              }
            }
          } catch (error) {
            console.error("Error restoring session:", error);
            localStorage.removeItem("roomId");
          }
        } else {
          setTimeout(checkAndRejoin, 100);
        }
      };
      setTimeout(checkAndRejoin, 100);
    } else if (roomIdFromUrl) {
      // Check if joining a room from URL
      if (storedName) {
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
        // Check if we still have a roomId in localStorage (user hasn't left)
        const storedRoomId = localStorage.getItem("roomId");
        if (!storedRoomId || storedRoomId !== gameRoom.id) {
          clearInterval(pollInterval);
          return;
        }

        const response = await fetch(`/api/rooms?roomId=${gameRoom.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.room) {
            setGameRoom(data.room);
          } else {
            // Room doesn't exist anymore, clear state
            leaveRoom();
          }
        } else if (response.status === 404) {
          // Room not found, clear state
          leaveRoom();
        }
      } catch (error) {
        console.error("Error polling room:", error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [gameRoom?.id, leaveRoom]);

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
      localStorage.setItem("roomId", data.room.id);
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

  const skipPhase = async () => {
    if (!gameRoom) return;

    try {
      const response = await fetch(`/api/rooms/${gameRoom.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "skip",
          playerId,
        }),
      });

      const data = await response.json();
      if (response.ok && data.room) {
        setGameRoom(data.room);
      } else {
        setError(data.error || "Failed to skip phase");
      }
    } catch (error) {
      console.error("Error skipping phase:", error);
      setError("Failed to skip phase");
    }
  };

  const nextRound = async () => {
    if (!gameRoom) return;

    try {
      const response = await fetch(`/api/rooms/${gameRoom.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "nextRound",
          playerId,
        }),
      });

      const data = await response.json();
      if (response.ok && data.room) {
        setGameRoom(data.room);
      } else {
        setError(data.error || "Failed to start next round");
      }
    } catch (error) {
      console.error("Error starting next round:", error);
      setError("Failed to start next round");
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
                    if (roomCode.trim()) {
                      joinRoom(roomCode.trim());
                    } else if (roomIdFromUrl) {
                      joinRoom(roomIdFromUrl);
                    } else {
                      createRoom();
                    }
                  }
                }}
                disabled={isLoading}
              />
            </div>

            {!roomIdFromUrl && (
              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Room Code (Optional)
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) =>
                    setRoomCode(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 6)
                    )
                  }
                  placeholder="Enter 6-digit code"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-center text-2xl font-bold tracking-widest text-black focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                  maxLength={6}
                  disabled={isLoading}
                />
                <p className="mt-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  Leave empty to create a new room
                </p>
              </div>
            )}

            {roomIdFromUrl ? (
              <button
                onClick={() => joinRoom(roomIdFromUrl)}
                disabled={isLoading || !playerName.trim()}
                className="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Joining..." : "Join Room"}
              </button>
            ) : roomCode.trim() ? (
              <button
                onClick={() => joinRoom(roomCode.trim())}
                disabled={
                  isLoading || !playerName.trim() || roomCode.length !== 6
                }
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
        onLeaveRoom={leaveRoom}
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
      onSkipPhase={skipPhase}
      onNextRound={nextRound}
      onLeaveRoom={leaveRoom}
    />
  );
}
