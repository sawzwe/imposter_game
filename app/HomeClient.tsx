"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "./components/AuthModal";
import { APP } from "./lib/constants";
import { getUserFriendlyError } from "./lib/errorHandler";

export default function HomeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomIdFromUrl = searchParams.get("room");
  const { user, signOut } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRoomCodeFromId = (roomId: string): string => {
    if (roomId.startsWith("room_")) {
      return roomId.replace("room_", "");
    }
    return roomId;
  };

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
        setError(
          data.error === "Room not found"
            ? "Room not found. Check the code and try again."
            : data.error || "Failed to join room",
        );
        return;
      }

      localStorage.setItem("playerName", nameToUse);
      localStorage.setItem("playerId", playerId);
      localStorage.setItem("roomId", data.room.id);
      setError(null);
      router.push(`/play?room=${getRoomCodeFromId(data.room.id)}`);
    } catch (error: any) {
      console.error("Error joining room:", error);
      setError(getUserFriendlyError(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Derive playerId: must match ^player_[a-zA-Z0-9_]+$ for API validation
  const toValidPlayerId = (raw: string) => {
    const safe = raw.replace(/[^a-zA-Z0-9_]/g, "_");
    return safe.startsWith("player_") ? safe : `player_${safe}`;
  };

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
    if (typeof window !== "undefined") {
      localStorage.setItem("playerId", id);
    }
  }, [user?.id]);

  useEffect(() => {
    // Restore player name
    const storedName = localStorage.getItem("playerName");
    if (storedName) {
      setPlayerName(storedName);
    }

    // If user has a room in session and no invite link, redirect to /play
    const storedRoomId = localStorage.getItem("roomId");
    if (storedRoomId && storedName && !roomIdFromUrl) {
      const roomCode = storedRoomId.startsWith("room_")
        ? storedRoomId.replace("room_", "")
        : storedRoomId;
      router.replace(`/play?room=${roomCode}`);
    }
  }, [router, roomIdFromUrl]);


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
      localStorage.setItem("playerId", playerId);
      localStorage.setItem("roomId", data.room.id);
      setError(null);
      router.push(`/play?room=${getRoomCodeFromId(data.room.id)}`);
    } catch (error: any) {
      console.error("Error creating room:", error);
      setError(error.message || "Failed to create room");
    } finally {
      setIsLoading(false);
    }
  };
  const handleSubmit = () => {
    if (roomIdFromUrl) joinRoom(roomIdFromUrl);
    else if (roomCode.trim().length === 4) joinRoom(roomCode.trim());
    else createRoom();
  };

  // Root: form — name + join/create room (invite link or direct)
  return (
      <>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
        <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
          {/* Single unified card — no floating cards */}
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] sm:max-w-2xl">
            {/* Header */}
            <div className="border-b border-[var(--border)] bg-[var(--surface2)] px-4 py-3 sm:px-6 sm:py-4">
              <h1 className="gradient-text font-display text-2xl font-bold tracking-wide sm:text-3xl">
                {APP.name}
              </h1>
              <p className="mb-0 mt-1 text-xs text-[var(--muted)] sm:text-sm">
                Play with Dota 2 Heroes or Clash Royale Cards ·{" "}
                <Link
                  href="/play"
                  className="text-[var(--blue)] hover:underline"
                >
                  Online lobbies
                </Link>
                {" · "}
                <Link
                  href="/headsup"
                  className="text-[var(--blue)] hover:underline"
                >
                  Heads Up
                </Link>
              </p>
            </div>

            {/* Content: form + login in one card */}
            <div className="flex flex-col sm:flex-row">
              {/* Join form — left */}
              <div className="flex-1 border-b border-[var(--border)] p-4 sm:border-b-0 sm:border-r sm:border-[var(--border)] sm:p-6">
                {error && (
                  <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-400">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
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
                      <p className="mb-1 text-sm font-medium text-[var(--green)]">
                        Invite link detected
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        Room: {roomIdFromUrl.toUpperCase()}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
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
                              .slice(0, 4),
                          )
                        }
                        placeholder="Enter 4-digit code"
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-3 text-center font-display text-xl font-bold tracking-[0.4em] text-[var(--text)] focus:border-[var(--blue)] focus:outline-none focus:ring-2 focus:ring-[var(--blue-glow)] sm:text-2xl"
                        maxLength={4}
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
                      className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--green)] px-4 py-3 font-display text-lg font-bold tracking-wide text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isLoading ? (
                        <>
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Joining...
                        </>
                      ) : (
                        "Join Room"
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        roomCode.trim().length === 4
                          ? joinRoom(roomCode.trim())
                          : createRoom()
                      }
                      disabled={
                        isLoading ||
                        !playerName.trim() ||
                        (roomCode.trim().length > 0 &&
                          roomCode.trim().length < 4)
                      }
                      className={`flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-3 font-display text-lg font-bold tracking-wide text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 ${
                        roomCode.trim().length > 0
                          ? "bg-[var(--green)] hover:brightness-110"
                          : "bg-[var(--blue)] hover:brightness-110"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          {roomCode.trim().length === 4
                            ? "Joining..."
                            : "Creating..."}
                        </>
                      ) : roomCode.trim().length > 0 ? (
                        "Join Room"
                      ) : (
                        "Create Room"
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Login — right */}
              <div className="flex-shrink-0 border-t border-[var(--border)] p-4 sm:border-t-0 sm:border-l-0 sm:w-56 sm:p-6">
                {user ? (
                  <div className="space-y-3">
                    <p className="font-display text-sm font-semibold text-[var(--text)]">
                      Signed in
                    </p>
                    <p
                      className="truncate text-xs text-[var(--muted)]"
                      title={user.email ?? undefined}
                    >
                      {user.email}
                    </p>
                    <button
                      type="button"
                      onClick={() => signOut()}
                      className="w-full min-h-[44px] rounded-xl bg-[var(--surface2)] px-3 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--border)]"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="font-display text-sm font-semibold text-[var(--text)]">
                      Have an account?
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Log in with email to sync across devices.
                    </p>
                    <button
                      type="button"
                      onClick={() => setAuthModalOpen(true)}
                      className="w-full min-h-[44px] rounded-xl bg-[var(--blue)] px-4 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                    >
                      Log in with email
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
}
