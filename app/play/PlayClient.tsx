"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "../components/AuthModal";
import GameLobby from "../components/GameLobby";
import GameScreen from "../components/GameScreen";
import HeadsUpMultiScreen from "../components/HeadsUpMultiScreen";
import HeadsUpOnline from "../components/HeadsUpOnline";
import { useToast } from "../components/ToastContext";
import { GameRoom, GameType } from "../types";

export default function PlayClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomCodeFromUrl = searchParams.get("room");
  const { showToast } = useToast();
  const { user, signOut } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastRoomUpdateRef = useRef<number>(0);

  const toValidPlayerId = (raw: string) => {
    const safe = raw.replace(/[^a-zA-Z0-9_]/g, "_");
    return safe.startsWith("player_") ? safe : `player_${safe}`;
  };

  const clearLocalRoomState = useCallback(() => {
    localStorage.removeItem("roomId");
    setGameRoom(null);
    router.push("/");
  }, [router]);

  const leaveRoom = useCallback(
    async (roomId?: string) => {
      const targetRoomId = roomId || localStorage.getItem("roomId");
      const currentPlayerId = localStorage.getItem("playerId");

      if (targetRoomId && currentPlayerId) {
        try {
          await fetch(`/api/rooms/${targetRoomId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "leaveRoom",
              playerId: currentPlayerId,
            }),
          });
        } catch {
          // Ignore
        }
      }

      localStorage.removeItem("roomId");
      setGameRoom(null);
      router.push("/");
    },
    [router],
  );

  const fetchRoomState = useCallback(
    async (roomId: string) => {
      try {
        const response = await fetch(`/api/rooms?roomId=${roomId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.room) {
            const currentPlayerId = localStorage.getItem("playerId");
            const playerStillInRoom = data.room.players.some(
              (p: any) => p.id === currentPlayerId,
            );

            if (!playerStillInRoom) {
              router.push(`/?room=${roomId.replace("room_", "")}`);
              return null;
            }

            if (
              data.room.lastUpdated &&
              data.room.lastUpdated > lastRoomUpdateRef.current
            ) {
              lastRoomUpdateRef.current = data.room.lastUpdated;
              return data.room;
            } else if (!data.room.lastUpdated) {
              return data.room;
            }
            return null;
          }
        } else if (response.status === 404) {
          router.push("/");
        }
      } catch (error) {
        console.error("Error fetching room:", error);
      }
      return null;
    },
    [router],
  );

  // Init playerId
  useEffect(() => {
    const raw =
      user?.id ??
      (typeof window !== "undefined"
        ? localStorage.getItem("playerId")
        : null) ??
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`);
    const id = toValidPlayerId(raw);
    setPlayerId(id);
    if (typeof window !== "undefined" && !user) {
      localStorage.setItem("playerId", id);
    }
  }, [user?.id]);

  // Restore player name
  useEffect(() => {
    const storedName = localStorage.getItem("playerName");
    if (storedName) setPlayerName(storedName);
  }, []);

  // Fetch room when room in URL
  useEffect(() => {
    if (!roomCodeFromUrl) {
      setIsLoading(false);
      return;
    }

    const roomId = roomCodeFromUrl.startsWith("room_")
      ? roomCodeFromUrl
      : `room_${roomCodeFromUrl.toUpperCase()}`;

    const load = async () => {
      try {
        const response = await fetch(`/api/rooms?roomId=${roomId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.room) {
            const currentPlayerId = localStorage.getItem("playerId");
            const playerInRoom = data.room.players.some(
              (p: any) => p.id === currentPlayerId,
            );
            if (playerInRoom) {
              localStorage.setItem("roomId", data.room.id);
              if (data.room.lastUpdated) {
                lastRoomUpdateRef.current = data.room.lastUpdated;
              }
              setGameRoom(data.room);
            } else {
              router.push(`/?room=${roomCodeFromUrl}`);
              return;
            }
          } else {
            router.push("/");
          }
        } else {
          router.push("/");
        }
      } catch {
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [roomCodeFromUrl, router]);

  // Poll for updates
  useEffect(() => {
    if (!gameRoom) return;

    if (gameRoom.lastUpdated) {
      lastRoomUpdateRef.current = gameRoom.lastUpdated;
    }

    const getPollInterval = () => {
      if (
        gameRoom.gameFormat === "headsup_online" &&
        gameRoom.gameState === "playing"
      ) {
        return 2000;
      }
      if (gameRoom.gameState === "playing" || gameRoom.gameState === "voting") {
        return 5000;
      }
      return 10000;
    };

    const pollInterval = setInterval(async () => {
      const storedRoomId = localStorage.getItem("roomId");
      if (!storedRoomId || storedRoomId !== gameRoom.id) {
        clearInterval(pollInterval);
        return;
      }

      const updatedRoom = await fetchRoomState(gameRoom.id);
      if (updatedRoom) setGameRoom(updatedRoom);
    }, getPollInterval());

    return () => clearInterval(pollInterval);
  }, [gameRoom?.id, gameRoom?.gameState, gameRoom?.gameFormat, fetchRoomState]);

  const addPlayer = async (name: string) => {
    if (!gameRoom) return;

    setIsAddingPlayer(true);
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
    } finally {
      setIsAddingPlayer(false);
    }
  };

  const apiCall = async (
    action: string,
    body: Record<string, unknown>,
  ): Promise<GameRoom | null> => {
    if (!gameRoom) return null;

    const response = await fetch(`/api/rooms/${gameRoom.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });

    const data = await response.json();
    if (response.ok && data.room) {
      if (data.room.lastUpdated) {
        lastRoomUpdateRef.current = data.room.lastUpdated;
      }
      setGameRoom(data.room);
      return data.room;
    }
    if (data.error) setError(data.error);
    return null;
  };

  const startGame = async (gameType: GameType) => {
    if (!gameRoom || gameRoom.players.length < 3) {
      setError("You need at least 3 players to start the game!");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await apiCall("start", { gameType });
    } catch (e: any) {
      setError(e.message || "Failed to start game");
    } finally {
      setIsLoading(false);
    }
  };

  const startHeadsUpOnline = async (gameType: GameType) => {
    if (!gameRoom || gameRoom.players.length < 2) {
      setError("You need at least 2 players to start!");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await apiCall("startHeadsUpOnline", { gameType });
    } catch (e: any) {
      setError(e.message || "Failed to start Online Heads Up");
    } finally {
      setIsLoading(false);
    }
  };

  const startHeadsUp = async (gameType: GameType) => {
    if (!gameRoom || gameRoom.players.length < 3) {
      setError("You need at least 3 players to start!");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await apiCall("startHeadsUp", { gameType });
    } catch (e: any) {
      setError(e.message || "Failed to start Heads Up");
    } finally {
      setIsLoading(false);
    }
  };

  const rotateCard = async (targetPlayerId: string) => {
    await apiCall("rotateCard", { playerId, targetPlayerId });
  };

  const submitClue = async (clue: string) => {
    const room = await apiCall("submitClue", { playerId, clue: clue.trim() });
    if (room) {
      setTimeout(async () => {
        const latest = await fetchRoomState(room.id);
        if (latest) setGameRoom(latest);
      }, 500);
    }
  };

  const vote = async (targetPlayerId: string) => {
    const room = await apiCall("vote", { playerId, targetPlayerId });
    if (room) {
      setTimeout(async () => {
        const latest = await fetchRoomState(room.id);
        if (latest) setGameRoom(latest);
      }, 500);
    }
  };

  const resetGame = async () => {
    await apiCall("reset", {});
  };

  const skipPhase = async () => {
    await apiCall("skip", { playerId });
  };

  const nextRound = async () => {
    await apiCall("nextRound", { playerId });
  };

  const toggleHints = async () => {
    await apiCall("toggleHints", { playerId });
  };

  const kickPlayer = async (targetPlayerId: string) => {
    await apiCall("kickPlayer", { playerId, targetPlayerId });
  };

  // No room in URL: show game type selector
  if (!roomCodeFromUrl) {
    return (
      <>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
          <h1 className="gradient-text mb-2 text-center font-display text-2xl font-bold tracking-wide sm:text-3xl">
            Online Lobbies
          </h1>
          <p className="mb-8 text-center text-sm text-[var(--muted)]">
            Choose a game to create or join a room
          </p>
          <div className="grid w-full max-w-md grid-cols-1 gap-4 sm:max-w-lg md:grid-cols-3 md:gap-6">
            <Link
              href="/"
              className="group flex flex-col items-center rounded-2xl border-2 border-[var(--border)] bg-[var(--surface2)] p-8 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-[var(--blue)] hover:shadow-[0_0_32px_var(--blue-glow)]"
            >
              <span className="mb-3 text-4xl transition-transform group-hover:scale-110">
                🎭
              </span>
              <span className="font-display text-xl font-bold text-[var(--text)]">
                impo
              </span>
              <span className="mt-1 text-sm text-[var(--muted)]">
                Find the imposter
              </span>
            </Link>
            <div className="flex flex-col items-center rounded-2xl border-2 border-[var(--border)] bg-[var(--surface2)] p-8 opacity-60">
              <span className="mb-3 text-4xl">🔍</span>
              <span className="font-display text-xl font-bold text-[var(--text)]">
                Guess Who
              </span>
              <span className="mt-1 text-sm text-[var(--muted)]">
                Coming soon
              </span>
            </div>
            <Link
              href="/headsup"
              className="group flex flex-col items-center rounded-2xl border-2 border-[var(--border)] bg-[var(--surface2)] p-8 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-[var(--blue)] hover:shadow-[0_0_32px_var(--blue-glow)]"
            >
              <span className="mb-3 text-4xl transition-transform group-hover:scale-110">
                👆
              </span>
              <span className="font-display text-xl font-bold text-[var(--text)]">
                Heads Up
              </span>
              <span className="mt-1 text-sm text-[var(--muted)]">
                Single device
              </span>
            </Link>
          </div>
          <Link
            href="/"
            className="mt-8 text-sm text-[var(--muted)] hover:text-[var(--text)]"
          >
            ← Back to home
          </Link>
        </div>
      </>
    );
  }

  // Loading
  if (isLoading && !gameRoom) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--blue)]" />
          <p className="text-[var(--muted)]">Loading room...</p>
        </div>
      </div>
    );
  }

  // No room (redirecting)
  if (!gameRoom) {
    return null;
  }

  if (
    gameRoom.gameState === "headsup_countdown" ||
    gameRoom.gameState === "headsup_playing"
  ) {
    return (
      <>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
        <HeadsUpMultiScreen
          gameRoom={gameRoom}
          playerId={playerId}
          isHost={gameRoom.players[0]?.id === playerId}
          onLeaveRoom={() => {
            showToast("Left the room");
            leaveRoom(gameRoom.id);
          }}
          onBackToLobby={resetGame}
        />
      </>
    );
  }

  if (
    gameRoom.gameFormat === "headsup_online" &&
    gameRoom.gameState === "playing"
  ) {
    return (
      <>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
        <HeadsUpOnline
          gameRoom={gameRoom}
          localPlayerId={playerId}
          isHost={gameRoom.players[0]?.id === playerId}
          onRotateCard={rotateCard}
          onLeaveRoom={() => {
            showToast("Left the room");
            leaveRoom(gameRoom.id);
          }}
          onBackToLobby={resetGame}
        />
      </>
    );
  }

  if (gameRoom.gameState === "lobby") {
    return (
      <>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
        <GameLobby
          gameRoom={gameRoom}
          playerId={playerId}
          playerName={playerName}
          onAddPlayer={addPlayer}
          onStartGame={startGame}
          onStartHeadsUp={startHeadsUp}
          onStartHeadsUpOnline={startHeadsUpOnline}
          isStarting={isLoading}
          isAddingPlayer={isAddingPlayer}
          onLeaveRoom={() => {
            showToast("Left the room");
            leaveRoom(gameRoom.id);
          }}
          onToggleHints={toggleHints}
          onKickPlayer={kickPlayer}
        />
      </>
    );
  }

  return (
    <>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
      <GameScreen
        gameRoom={gameRoom}
        playerId={playerId}
        playerName={playerName}
        onSubmitClue={submitClue}
        onVote={vote}
        onResetGame={resetGame}
        onSkipPhase={skipPhase}
        onNextRound={nextRound}
        onLeaveRoom={() => leaveRoom(gameRoom.id)}
      />
    </>
  );
}
