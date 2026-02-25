"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import GameLobby from "./components/GameLobby";
import GameScreen from "./components/GameScreen";
import HeadsUpScreen from "./components/HeadsUpScreen";
import LoadingSpinner from "./components/LoadingSpinner";
import { useToast } from "./components/ToastContext";
import { GameRoom } from "./types";
import { getUserFriendlyError } from "./lib/errorHandler";

export default function HomeClient() {
  const searchParams = useSearchParams();
  const roomIdFromUrl = searchParams.get("room");
  const { showToast } = useToast();

  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [showHeadsUp, setShowHeadsUp] = useState(false);
  const [showGameSelect, setShowGameSelect] = useState(true);
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRoomUpdateRef = useRef<number>(0);

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

  // Helper function to fetch room state
  const fetchRoomState = useCallback(
    async (roomId: string) => {
      try {
        const response = await fetch(`/api/rooms?roomId=${roomId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.room) {
            // Check if current player is still in the room (might have been kicked)
            const currentPlayerId = localStorage.getItem("playerId");
            const playerStillInRoom = data.room.players.some(
              (p: any) => p.id === currentPlayerId,
            );

            if (!playerStillInRoom) {
              // Player was kicked, return to home
              leaveRoom();
              return null;
            }

            // Only update if room has actually changed
            if (
              data.room.lastUpdated &&
              data.room.lastUpdated > lastRoomUpdateRef.current
            ) {
              lastRoomUpdateRef.current = data.room.lastUpdated;
              return data.room;
            } else if (!data.room.lastUpdated) {
              // Fallback if lastUpdated not set
              return data.room;
            }
            return null;
          }
        } else if (response.status === 404) {
          // Room not found, clear state
          leaveRoom();
        }
      } catch (error) {
        console.error("Error fetching room:", error);
      }
      return null;
    },
    [leaveRoom],
  );

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
      if (data.room.lastUpdated) {
        lastRoomUpdateRef.current = data.room.lastUpdated;
      }
      setGameRoom(data.room);
      setError(null);
    } catch (error: any) {
      console.error("Error joining room:", error);
      setError(getUserFriendlyError(error));
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
                  (p: any) => p.id === currentPlayerId,
                );
                if (playerInRoom) {
                  setGameRoom(data.room);
                } else {
                  // Player not in room (might have been kicked), clear state and go home
                  localStorage.removeItem("roomId");
                  // Don't try to rejoin automatically if kicked
                }
              }
            } else if (response.status === 404) {
              // Room doesn't exist, clear state
              localStorage.removeItem("roomId");
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

  // Poll for game state updates - less frequently and only when needed
  useEffect(() => {
    if (!gameRoom) return;

    // Update lastRoomUpdateRef when gameRoom changes
    if (gameRoom.lastUpdated) {
      lastRoomUpdateRef.current = gameRoom.lastUpdated;
    }

    // Determine polling interval based on game state
    // More frequent during active gameplay, less frequent in lobby/finished
    const getPollInterval = () => {
      if (gameRoom.gameState === "playing" || gameRoom.gameState === "voting") {
        return 5000; // 5 seconds during active gameplay
      }
      return 10000; // 10 seconds in lobby or finished state
    };

    const pollInterval = setInterval(async () => {
      try {
        // Check if we still have a roomId in localStorage (user hasn't left)
        const storedRoomId = localStorage.getItem("roomId");
        if (!storedRoomId || storedRoomId !== gameRoom.id) {
          clearInterval(pollInterval);
          return;
        }

        const updatedRoom = await fetchRoomState(gameRoom.id);
        if (updatedRoom) {
          setGameRoom(updatedRoom);
        }
      } catch (error) {
        console.error("Error polling room:", error);
      }
    }, getPollInterval());

    return () => clearInterval(pollInterval);
  }, [gameRoom?.id, gameRoom?.gameState, fetchRoomState]);

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
      setError(null);
      localStorage.setItem("roomId", data.room.id);
      if (data.room.lastUpdated) {
        lastRoomUpdateRef.current = data.room.lastUpdated;
      }
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
        if (data.room.lastUpdated) {
          lastRoomUpdateRef.current = data.room.lastUpdated;
        }
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

      if (data.room) {
        if (data.room.lastUpdated) {
          lastRoomUpdateRef.current = data.room.lastUpdated;
        }
        setGameRoom(data.room);
      }
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
        // Immediately update after user action
        if (data.room.lastUpdated) {
          lastRoomUpdateRef.current = data.room.lastUpdated;
        }
        setGameRoom(data.room);
        // Also fetch latest state to ensure we have all updates
        setTimeout(async () => {
          const latestRoom = await fetchRoomState(data.room.id);
          if (latestRoom) setGameRoom(latestRoom);
        }, 500);
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
        // Immediately update after user action
        if (data.room.lastUpdated) {
          lastRoomUpdateRef.current = data.room.lastUpdated;
        }
        setGameRoom(data.room);
        // Also fetch latest state to ensure we have all updates
        setTimeout(async () => {
          const latestRoom = await fetchRoomState(data.room.id);
          if (latestRoom) setGameRoom(latestRoom);
        }, 500);
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
        if (data.room.lastUpdated) {
          lastRoomUpdateRef.current = data.room.lastUpdated;
        }
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

  const toggleHints = async () => {
    if (!gameRoom) return;

    try {
      const response = await fetch(`/api/rooms/${gameRoom.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggleHints",
          playerId,
        }),
      });

      const data = await response.json();
      if (response.ok && data.room) {
        setGameRoom(data.room);
      } else {
        setError(data.error || "Failed to toggle hints");
      }
    } catch (error) {
      console.error("Error toggling hints:", error);
      setError("Failed to toggle hints");
    }
  };

  const kickPlayer = async (targetPlayerId: string) => {
    if (!gameRoom) return;

    try {
      const response = await fetch(`/api/rooms/${gameRoom.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "kickPlayer",
          playerId,
          targetPlayerId,
        }),
      });

      const data = await response.json();
      if (response.ok && data.room) {
        setGameRoom(data.room);
      } else {
        setError(data.error || "Failed to kick player");
      }
    } catch (error) {
      console.error("Error kicking player:", error);
      setError("Failed to kick player");
    }
  };

  const handleSubmit = () => {
    if (roomIdFromUrl) joinRoom(roomIdFromUrl);
    else if (roomCode.trim().length === 6) joinRoom(roomCode.trim());
    else createRoom();
  };

  // Heads Up - single device game
  if (showHeadsUp) {
    return (
      <HeadsUpScreen
        onBack={() => {
          setShowHeadsUp(false);
          setShowGameSelect(true);
        }}
      />
    );
  }

  // Game mode selector - when no room and no invite link
  if (showGameSelect && !gameRoom && !roomIdFromUrl) {
    return (
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6">
        <h1 className="gradient-text mb-2 text-center font-['Rajdhani'] text-3xl font-bold tracking-wide">
          Imposter Game
        </h1>
        <p className="mb-8 text-center text-sm text-[var(--muted)]">
          Play with Dota 2 Heroes or Clash Royale Cards
        </p>
        <div className="grid w-full max-w-md grid-cols-2 gap-6">
          <button
            onClick={() => setShowGameSelect(false)}
            className="animate-game-select-in group flex flex-col items-center rounded-2xl border-2 border-[var(--border)] bg-[var(--surface2)] p-8 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-[var(--blue)] hover:shadow-[0_0_32px_var(--blue-glow)] active:scale-[0.98]"
          >
            <span className="mb-3 text-4xl transition-transform duration-300 group-hover:scale-110">
              🎭
            </span>
            <span className="font-['Rajdhani'] text-xl font-bold text-[var(--text)]">
              Imposter
            </span>
            <span className="mt-1 text-sm text-[var(--muted)]">
              Multiplayer · Find the imposter
            </span>
          </button>
          <button
            onClick={() => {
              setShowGameSelect(false);
              setShowHeadsUp(true);
            }}
            className="animate-game-select-in-delay-1 group flex flex-col items-center rounded-2xl border-2 border-[var(--border)] bg-[var(--surface2)] p-8 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-[var(--blue)] hover:shadow-[0_0_32px_var(--blue-glow)] active:scale-[0.98]"
          >
            <span className="mb-3 text-4xl transition-transform duration-300 group-hover:scale-110">
              👆
            </span>
            <span className="font-['Rajdhani'] text-xl font-bold text-[var(--text)]">
              Heads Up
            </span>
            <span className="mt-1 text-sm text-[var(--muted)]">
              Single device · Ask questions
            </span>
          </button>
        </div>
      </div>
    );
  }

  if (!gameRoom) {
    return (
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl">
          {!roomIdFromUrl && (
            <button
              onClick={() => setShowGameSelect(true)}
              className="mb-4 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]"
            >
              ← Back
            </button>
          )}
          <h1 className="gradient-text mb-2 text-center font-['Rajdhani'] text-3xl font-bold tracking-wide">
            Imposter Game
          </h1>
          <p className="mb-6 text-center text-sm text-[var(--muted)]">
            Play with Dota 2 Heroes or Clash Royale Cards
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-400">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="mb-4">
              <LoadingSpinner text="Loading..." />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text)]">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-3 text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--blue)] focus:outline-none focus:ring-2 focus:ring-[var(--blue-glow)]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) handleSubmit();
                }}
                disabled={isLoading}
              />
            </div>

            {roomIdFromUrl ? (
              <div className="rounded-xl border border-[var(--green)]/40 bg-green-500/10 p-3">
                <p className="mb-2 text-sm font-medium text-[var(--green)]">
                  Invite link detected
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Room: {roomIdFromUrl.toUpperCase()}
                </p>
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text)]">
                  Room Code{" "}
                  <span className="text-[var(--muted)]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) =>
                    setRoomCode(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 6),
                    )
                  }
                  placeholder="Enter 6-digit code"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-3 text-center font-['Rajdhani'] text-2xl font-bold tracking-[0.3em] text-[#5b8fff] focus:border-[var(--blue)] focus:outline-none focus:ring-2 focus:ring-[var(--blue-glow)]"
                  maxLength={6}
                  disabled={isLoading}
                />
                <p className="mt-1.5 text-center text-xs text-[var(--muted)]">
                  Leave empty to create a new room
                </p>
              </div>
            )}

            {roomIdFromUrl ? (
              <button
                onClick={() => joinRoom(roomIdFromUrl)}
                disabled={isLoading || !playerName.trim()}
                className="w-full rounded-xl bg-[var(--green)] px-4 py-3 font-['Rajdhani'] text-lg font-bold tracking-wide text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Joining..." : "Join Room"}
              </button>
            ) : roomCode.trim().length === 6 ? (
              <button
                onClick={() => joinRoom(roomCode.trim())}
                disabled={isLoading || !playerName.trim()}
                className="w-full rounded-xl bg-[var(--green)] px-4 py-3 font-['Rajdhani'] text-lg font-bold tracking-wide text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Joining..." : "Join Room"}
              </button>
            ) : (
              <button
                onClick={createRoom}
                disabled={isLoading || !playerName.trim()}
                className="w-full rounded-xl bg-[var(--blue)] px-4 py-3 font-['Rajdhani'] text-lg font-bold tracking-wide text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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
        onLeaveRoom={() => {
          showToast("Left the room");
          leaveRoom();
        }}
        onToggleHints={toggleHints}
        onKickPlayer={kickPlayer}
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
