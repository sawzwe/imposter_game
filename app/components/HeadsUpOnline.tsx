"use client";

import { GameRoom, Player } from "../types";

interface HeadsUpOnlineProps {
  gameRoom: GameRoom;
  localPlayerId: string;
  isHost?: boolean;
  onRotateCard: (targetPlayerId: string) => Promise<void>;
  onNextTurn?: () => void;
  onNextRound?: () => void;
  onLeaveRoom: () => void;
  onBackToLobby?: () => void;
}

export default function HeadsUpOnline({
  gameRoom,
  localPlayerId,
  isHost,
  onRotateCard,
  onNextTurn,
  onNextRound,
  onLeaveRoom,
  onBackToLobby,
}: HeadsUpOnlineProps) {
  const localPlayer = gameRoom.players.find((p) => p.id === localPlayerId);
  const currentTurnPlayer = gameRoom.players.find(
    (p) => p.id === gameRoom.currentTurnPlayerId
  );
  const turnName = currentTurnPlayer?.name ?? "—";

  return (
    <div className="relative z-10 flex min-h-screen flex-col p-4 sm:p-6">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="gradient-text mb-1 text-center font-display text-2xl font-bold tracking-wide md:text-3xl">
          Guess Who
        </h1>
        <p className="mb-4 text-center text-sm text-[var(--muted)]">
          You see everyone&apos;s card except your own. Ask yes/no questions!
        </p>

        {/* Speaking — prominent, with Next turn */}
        <div className="mb-4 rounded-xl border-2 border-[var(--blue)] bg-[var(--blue)]/10 p-4 shadow-[0_0_24px_var(--blue-glow)]">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Speaking
          </p>
          <p className="mb-3 text-center font-display text-xl font-bold text-[var(--blue)]">
            {turnName}
          </p>
          {isHost && onNextTurn && (
            <button
              onClick={onNextTurn}
              className="mx-auto flex w-full max-w-[200px] items-center justify-center rounded-xl bg-[var(--blue)] px-4 py-3 font-display font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Next turn →
            </button>
          )}
        </div>

        {/* Score */}
        {localPlayer && typeof localPlayer.score === "number" && (
          <div className="mb-4 flex justify-center">
            <span className="rounded-xl border border-[var(--gold)] bg-[var(--gold)]/10 px-4 py-2 font-display text-lg font-bold text-[var(--gold)]">
              You: {localPlayer.score} correct
            </span>
          </div>
        )}

        {/* Your card — compact, always visible */}
        <div className="mb-4 rounded-xl border-2 border-dashed border-[var(--blue)] bg-[var(--surface)] p-4">
          <p className="mb-2 text-center font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Your card
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="font-display text-3xl font-bold text-[var(--blue)]">
              ???
            </span>
            <span className="text-xs text-[var(--muted)]">
              Others can see it — ask questions!
            </span>
          </div>
        </div>

        {/* Others' cards — compact horizontal scroll on mobile, grid on larger */}
        <p className="mb-2 font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          Others&apos; cards
        </p>
        <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
          {gameRoom.players
            .filter((p) => p.id !== localPlayerId)
            .map((player: Player) => {
              const isSpeaking = gameRoom.currentTurnPlayerId === player.id;
              return (
              <div
                key={player.id}
                className={`flex min-w-[140px] shrink-0 flex-col rounded-xl border-2 p-3 transition-all sm:min-w-0 ${
                  isSpeaking
                    ? "border-[var(--blue)] bg-[var(--blue)]/10 shadow-[0_0_20px_var(--blue-glow)] ring-2 ring-[var(--blue)]/50"
                    : "border-[var(--border)] bg-[var(--surface2)]"
                }`}
              >
                <p className="mb-2 truncate font-display text-sm font-bold text-[var(--text)]">
                  {player.name}
                  {isSpeaking && (
                    <span className="ml-1 rounded bg-[var(--blue)]/30 px-1.5 py-0.5 text-xs font-bold text-[var(--blue)]">
                      speaking
                    </span>
                  )}
                </p>
                <div className="flex flex-1 flex-col items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
                  {player.assignedCardImage && (
                    <img
                      src={player.assignedCardImage}
                      alt={player.assignedCardName || ""}
                      className="h-14 w-14 rounded-lg object-contain sm:h-16 sm:w-16"
                    />
                  )}
                  <p className="mt-1 truncate text-center text-sm font-bold text-[var(--text)]">
                    {player.assignedCardName || "—"}
                  </p>
                  {typeof player.score === "number" && (
                    <p className="mt-0.5 text-xs text-[var(--gold)]">
                      {player.score} correct
                    </p>
                  )}
                </div>
                {isHost && (
                  <button
                    onClick={() => onRotateCard(player.id)}
                    className="mt-2 rounded-lg border-2 border-[var(--green)] bg-[var(--green)]/20 py-3 font-display text-sm font-bold text-[var(--green)] transition-all hover:bg-[var(--green)]/30"
                  >
                    Correct ✓
                  </button>
                )}
                {!isHost && (
                  <p className="mt-2 text-center text-xs text-[var(--muted)]">
                    Host marks correct
                  </p>
                )}
              </div>
            );
            })}
        </div>

        <div className="mt-8 space-y-3">
          {isHost && onNextRound && (
            <button
              onClick={onNextRound}
              className="w-full rounded-xl bg-[var(--blue)] px-4 py-4 font-display text-lg font-bold tracking-wide text-white transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Next round (new cards)
            </button>
          )}
        </div>

        {/* Room options — separate section, less prominent */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 border-t border-[var(--border)] pt-6">
          {isHost && onBackToLobby && (
            <button
              onClick={onBackToLobby}
              className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--blue)]"
            >
              ← Back to Lobby
            </button>
          )}
          <button
            onClick={onLeaveRoom}
            className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--red)]"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
