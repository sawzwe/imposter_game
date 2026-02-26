"use client";

import { useState } from "react";
import { Copy, Check } from "phosphor-react";
import { useToast } from "./ToastContext";
import { GameRoom, GameType, GameFormat } from "../types";

interface GameLobbyProps {
  gameRoom: GameRoom;
  playerId: string;
  playerName: string;
  onAddPlayer: (name: string) => void;
  onStartGame: (gameType: GameType) => void;
  onStartHeadsUp?: (gameType: GameType) => void;
  onStartHeadsUpOnline?: (gameType: GameType) => void;
  onLeaveRoom?: () => void;
  onToggleHints?: () => void;
  onKickPlayer?: (playerId: string) => void;
  isStarting?: boolean;
  isAddingPlayer?: boolean;
}

export default function GameLobby({
  gameRoom,
  playerId,
  playerName,
  onAddPlayer,
  onStartGame,
  onStartHeadsUp,
  onStartHeadsUpOnline,
  onLeaveRoom,
  onToggleHints,
  onKickPlayer,
  isStarting = false,
  isAddingPlayer = false,
}: GameLobbyProps) {
  const [newPlayerName, setNewPlayerName] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameType>("dota2");
  const [gameFormat, setGameFormat] = useState<GameFormat>("imposter");
  const { showToast } = useToast();

  const isHost = gameRoom.players[0]?.id === playerId;

  // Extract room code from roomId (format: room_XXXXXX)
  const getRoomCode = (roomId: string): string => {
    if (roomId.startsWith("room_")) {
      return roomId.replace("room_", "");
    }
    return roomId;
  };

  const roomCode = getRoomCode(gameRoom.id);
  const roomUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}?room=${roomCode}`
      : "";

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      onAddPlayer(newPlayerName.trim());
      showToast(`${newPlayerName.trim()} joined!`);
      setNewPlayerName("");
    }
  };

  const copyRoomLink = async () => {
    if (roomUrl) {
      try {
        await navigator.clipboard.writeText(roomUrl);
        setCopied(true);
        showToast("Invite link copied!");
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
        showToast("Copy failed");
      }
    }
  };

  const copyRoomCode = async () => {
    if (roomCode) {
      try {
        await navigator.clipboard.writeText(roomCode);
        setCopiedCode(true);
        showToast("Room code copied!");
        setTimeout(() => setCopiedCode(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
        showToast("Copy failed");
      }
    }
  };

  const minPlayers =
    gameFormat === "headsup_online" ? 2 : 3;
  const canStart = gameRoom.players.length >= minPlayers;

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl">
        <h1 className="gradient-text mb-6 text-center font-display text-3xl font-bold tracking-wide">
          Game Lobby
        </h1>

        <div className="mb-6">
          <div className="mb-4 rounded-2xl border-2 border-[var(--blue)] bg-[#0d1220] p-6 text-center shadow-[0_0_28px_var(--blue-glow)]">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[var(--muted)]">
              Room Code
            </p>
            <div className="flex items-center justify-center gap-3">
              <p className="font-display text-4xl font-bold tracking-[0.2em] text-[#5b8fff]">
                {roomCode}
              </p>
              <button
                onClick={copyRoomCode}
                className="flex items-center justify-center rounded-xl bg-[var(--blue)] p-2.5 text-white transition-all hover:scale-110 hover:brightness-110 active:scale-95"
                title="Copy room code"
              >
                {copiedCode ? (
                  <Check size={20} weight="bold" />
                ) : (
                  <Copy size={20} weight="bold" />
                )}
              </button>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Players: {gameRoom.players.length} / 10
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-4">
            <p className="mb-2 text-sm font-medium text-[var(--muted)]">
              Share this link to invite players:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomUrl}
                readOnly
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--muted)] focus:outline-none"
              />
              <button
                onClick={copyRoomLink}
                className="rounded-lg bg-[var(--blue)] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
              >
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="mb-3 font-display text-lg font-bold tracking-wide text-[var(--text)]">
            Players
          </h2>
          <div className="space-y-2">
            {gameRoom.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-3"
              >
                <span className="text-[var(--text)]">
                  {player.name}
                  {player.id === playerId && (
                    <span className="ml-2 rounded bg-[var(--blue)]/20 px-1.5 py-0.5 text-xs font-semibold text-[#5b8fff]">
                      You
                    </span>
                  )}
                  {player.id === gameRoom.players[0]?.id && (
                    <span className="ml-2 rounded bg-[var(--gold)]/20 px-1.5 py-0.5 text-xs font-semibold text-[var(--gold)]">
                      Host
                    </span>
                  )}
                </span>
                {isHost && player.id !== playerId && onKickPlayer && (
                  <button
                    onClick={() => onKickPlayer(player.id)}
                    className="rounded-lg bg-[var(--red)]/20 px-3 py-1 text-sm font-semibold text-[var(--red)] transition-colors hover:bg-[var(--red)]/30"
                  >
                    Kick
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <div className="mb-6">
            <h2 className="mb-3 font-display text-lg font-bold tracking-wide text-[var(--text)]">
              Add Player
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Enter player name"
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-3 text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--blue)] focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddPlayer();
                }}
              />
              <button
                onClick={handleAddPlayer}
                disabled={isAddingPlayer}
                className="flex min-w-[5rem] items-center justify-center gap-2 rounded-xl bg-[var(--green)] px-6 py-3 font-bold text-white transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isAddingPlayer ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Add...
                  </>
                ) : (
                  "Add"
                )}
              </button>
            </div>
          </div>
        )}

        {isHost && (
          <div className="space-y-4">
            <div>
              <h2 className="mb-3 font-display text-lg font-bold tracking-wide text-[var(--text)]">
                Game Format
              </h2>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <button
                  onClick={() => setGameFormat("imposter")}
                  className={`rounded-xl border-2 p-4 text-center transition-all ${
                    gameFormat === "imposter"
                      ? "border-[var(--blue)] bg-[#0d1220] shadow-[0_0_24px_var(--blue-glow)]"
                      : "border-[var(--border)] bg-[var(--surface2)]"
                  }`}
                >
                  <div className="mb-1 text-2xl">🎭</div>
                  <div className="font-display font-bold text-[var(--text)]">
                    Imposter
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    Find the imposter
                  </div>
                </button>
                <button
                  onClick={() => setGameFormat("headsup")}
                  className={`rounded-xl border-2 p-4 text-center transition-all ${
                    gameFormat === "headsup"
                      ? "border-[var(--blue)] bg-[#0d1220] shadow-[0_0_24px_var(--blue-glow)]"
                      : "border-[var(--border)] bg-[var(--surface2)]"
                  }`}
                >
                  <div className="mb-1 text-2xl">👆</div>
                  <div className="font-display font-bold text-[var(--text)]">
                    Heads Up
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    Turn phone around · Ask questions
                  </div>
                </button>
                <button
                  onClick={() => setGameFormat("headsup_online")}
                  className={`rounded-xl border-2 p-4 text-center transition-all ${
                    gameFormat === "headsup_online"
                      ? "border-[var(--blue)] bg-[#0d1220] shadow-[0_0_24px_var(--blue-glow)]"
                      : "border-[var(--border)] bg-[var(--surface2)]"
                  }`}
                >
                  <div className="mb-1 text-2xl">🌐</div>
                  <div className="font-display font-bold text-[var(--text)]">
                    Online
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    Each device · See others&apos; cards
                  </div>
                </button>
              </div>
            </div>

            {gameFormat === "imposter" && onToggleHints && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-[var(--text)]">
                      Imposter Hints
                    </h3>
                    <p className="text-sm text-[var(--muted)]">
                      {gameRoom.hintsEnabled !== false
                        ? "Hints are enabled for imposters"
                        : "Hints are disabled - imposters get no clues"}
                    </p>
                  </div>
                  <button
                    onClick={onToggleHints}
                    className={`rounded-lg px-4 py-2 font-bold transition-all active:scale-95 ${
                      gameRoom.hintsEnabled !== false
                        ? "bg-[var(--green)] text-white hover:brightness-110"
                        : "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--border)]"
                    }`}
                  >
                    {gameRoom.hintsEnabled !== false ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>
            )}

            <div>
              <h2 className="mb-3 font-display text-lg font-bold tracking-wide text-[var(--text)]">
                Select Game
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedGame("dota2")}
                  className={`rounded-xl border-2 p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                    selectedGame === "dota2"
                      ? "border-[var(--blue)] bg-[#0d1220] shadow-[0_0_24px_var(--blue-glow)]"
                      : "border-[var(--border)] bg-[var(--surface2)] hover:border-[var(--border)]"
                  }`}
                >
                  <div className="mb-2 text-2xl">⚔️</div>
                  <div className="font-display font-bold text-[var(--text)]">
                    Dota 2
                  </div>
                  <div className="text-sm text-[var(--muted)]">Heroes</div>
                </button>
                <button
                  onClick={() => setSelectedGame("clashroyale")}
                  className={`rounded-xl border-2 p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                    selectedGame === "clashroyale"
                      ? "border-[var(--blue)] bg-[#0d1220] shadow-[0_0_24px_var(--blue-glow)]"
                      : "border-[var(--border)] bg-[var(--surface2)] hover:border-[var(--border)]"
                  }`}
                >
                  <div className="mb-2 text-2xl">👑</div>
                  <div className="font-display font-bold text-[var(--text)]">
                    Clash Royale
                  </div>
                  <div className="text-sm text-[var(--muted)]">Cards</div>
                </button>
              </div>
            </div>
            {gameFormat === "headsup" && onStartHeadsUp ? (
              <button
                onClick={() => onStartHeadsUp(selectedGame)}
                disabled={!canStart || isStarting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--blue)] px-4 py-4 font-display text-lg font-bold tracking-wide text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isStarting ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Starting...
                  </>
                ) : (
                  <>Start Heads Up · {selectedGame === "dota2" ? "Dota 2" : "Clash Royale"} ({gameRoom.players.length} players)</>
                )}
              </button>
            ) : gameFormat === "headsup_online" && onStartHeadsUpOnline ? (
              <button
                onClick={() => onStartHeadsUpOnline(selectedGame)}
                disabled={!canStart || isStarting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--blue)] px-4 py-4 font-display text-lg font-bold tracking-wide text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isStarting ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Starting...
                  </>
                ) : (
                  <>Start Online · {selectedGame === "dota2" ? "Dota 2" : "Clash Royale"} ({gameRoom.players.length} players)</>
                )}
              </button>
            ) : (
              <button
                onClick={() => onStartGame(selectedGame)}
                disabled={!canStart || isStarting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--blue)] px-4 py-4 font-display text-lg font-bold tracking-wide text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isStarting ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Starting...
                  </>
                ) : (
                  <>Start Imposter · {selectedGame === "dota2" ? "Dota 2" : "Clash Royale"} ({gameRoom.players.length} players)</>
                )}
              </button>
            )}
            {!canStart && (
              <p className="mt-2 text-center text-sm text-[var(--muted)]">
                Need at least {minPlayers} players to start
              </p>
            )}
          </div>
        )}

        {!isHost && (
          <div className="flex items-center justify-center gap-2 py-4 text-[var(--muted)]">
            <span className="inline-flex gap-1">
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)]"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)]"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)]"
                style={{ animationDelay: "300ms" }}
              />
            </span>
            Waiting for host to start...
          </div>
        )}

        {onLeaveRoom && (
          <button
            onClick={onLeaveRoom}
            className="mt-4 w-full rounded-xl border border-[var(--border)] bg-transparent py-3 font-semibold text-[var(--muted)] transition-colors hover:border-[var(--red)] hover:bg-[var(--red)]/10 hover:text-[var(--red)]"
          >
            Leave Room
          </button>
        )}
      </div>
    </div>
  );
}
