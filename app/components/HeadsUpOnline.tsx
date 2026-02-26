"use client";

import { GameRoom, Player } from "../types";

interface HeadsUpOnlineProps {
  gameRoom: GameRoom;
  localPlayerId: string;
  onRotateCard: (targetPlayerId: string) => Promise<void>;
  onLeaveRoom: () => void;
}

export default function HeadsUpOnline({
  gameRoom,
  localPlayerId,
  onRotateCard,
  onLeaveRoom,
}: HeadsUpOnlineProps) {
  const localPlayer = gameRoom.players.find((p) => p.id === localPlayerId);

  return (
    <div className="relative z-10 flex min-h-screen flex-col p-6">
      <div className="mx-auto w-full max-w-lg">
        <h1 className="gradient-text mb-1 text-center font-display text-2xl font-bold tracking-wide md:text-3xl">
          Online Heads Up
        </h1>
        <p className="mb-6 text-center text-sm text-[var(--muted)]">
          You see everyone&apos;s card except your own. Ask yes/no questions!
        </p>

        {/* Score summary */}
        {localPlayer && typeof localPlayer.score === "number" && (
          <div className="mb-4 flex justify-center">
            <span className="rounded-xl border border-[var(--gold)] bg-[var(--gold)]/10 px-4 py-2 font-display text-lg font-bold text-[var(--gold)]">
              You: {localPlayer.score} correct
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {gameRoom.players.map((player: Player) => {
            const isSelf = player.id === localPlayerId;

            return (
              <div
                key={player.id}
                className="flex flex-col rounded-2xl border-2 border-[var(--border)] bg-[var(--surface2)] p-5 transition-all"
              >
                <p className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
                  {player.name}
                  {isSelf && (
                    <span className="ml-2 font-normal text-[var(--blue)]">
                      (you)
                    </span>
                  )}
                </p>

                {isSelf ? (
                  /* Mystery Card — player sees ??? for their own card */
                  <div className="flex min-h-[120px] flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--blue)] bg-[var(--surface)] shadow-[0_0_20px_var(--blue-glow)] animate-pulse">
                    <span className="font-display text-4xl font-bold text-[var(--blue)]">
                      ???
                    </span>
                    <span className="mt-1 text-xs text-[var(--muted)]">
                      Your card — others can see it
                    </span>
                  </div>
                ) : (
                  /* Other player — show their assigned card with image */
                  <>
                    <div className="min-h-[100px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                      {player.assignedCardImage && (
                        <div className="mb-3 flex justify-center">
                          <img
                            src={player.assignedCardImage}
                            alt={player.assignedCardName || ""}
                            className="h-20 w-20 rounded-lg object-contain sm:h-24 sm:w-24"
                          />
                        </div>
                      )}
                      <p className="font-display text-xl font-bold leading-tight text-[var(--text)] md:text-2xl">
                        {player.assignedCardName || "—"}
                      </p>
                      {typeof player.score === "number" && (
                        <p className="mt-2 text-sm text-[var(--gold)]">
                          {player.score} correct
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => onRotateCard(player.id)}
                      className="mt-3 rounded-xl border-2 border-[var(--green)] bg-[var(--green)]/20 py-2.5 font-display font-bold text-[var(--green)] transition-all hover:bg-[var(--green)]/30 hover:shadow-[0_0_12px_rgba(34,197,94,0.2)] active:scale-[0.98]"
                    >
                      Correct ✓
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={onLeaveRoom}
          className="mt-8 w-full rounded-xl border border-[var(--border)] bg-transparent py-3 font-semibold text-[var(--muted)] transition-colors hover:border-[var(--red)] hover:bg-[var(--red)]/10 hover:text-[var(--red)]"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}
