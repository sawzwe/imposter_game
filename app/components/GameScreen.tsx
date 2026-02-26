"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "./ToastContext";
import { GameRoom } from "../types";

interface GameScreenProps {
  gameRoom: GameRoom;
  playerId: string;
  playerName: string;
  onSubmitClue: (clue: string) => void;
  onVote: (targetPlayerId: string) => void;
  onResetGame: () => void;
  onSkipPhase?: () => void;
  onNextRound?: () => void;
  onLeaveRoom?: () => void;
}

export default function GameScreen({
  gameRoom,
  playerId,
  playerName,
  onSubmitClue,
  onVote,
  onResetGame,
  onSkipPhase,
  onNextRound,
  onLeaveRoom,
}: GameScreenProps) {
  const [clue, setClue] = useState("");
  const { showToast } = useToast();
  const VOTING_DURATION = 60; // 60 seconds
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentPlayer = gameRoom.players.find((p) => p.id === playerId);
  const hasVoted = gameRoom.votes.some((v) => v.voterId === playerId);

  if (!currentPlayer) return null;

  const isImposter = currentPlayer.isImposter;
  const hasSubmittedClue = currentPlayer.hasSubmittedClue;
  const isHost = gameRoom.players[0]?.id === playerId;

  // Timer effect for voting phase
  useEffect(() => {
    if (gameRoom.gameState === "voting" && gameRoom.votingStartTime) {
      const updateTimer = () => {
        const elapsed = (Date.now() - gameRoom.votingStartTime!) / 1000;
        const remaining = Math.max(0, VOTING_DURATION - elapsed);
        setTimeRemaining(Math.ceil(remaining));

        // Auto-finish when timer reaches 0
        if (remaining <= 0 && isHost && onSkipPhase) {
          onSkipPhase();
        }
      };

      updateTimer();
      intervalRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else if (gameRoom.gameState === "voting" && !gameRoom.votingStartTime) {
      // If no start time, set default timer
      setTimeRemaining(VOTING_DURATION);
    } else {
      // Clear timer when not in voting phase
      setTimeRemaining(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [gameRoom.gameState, gameRoom.votingStartTime, isHost, onSkipPhase]);

  if (gameRoom.gameState === "playing") {
    return (
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl">
          <h1 className="mb-6 text-center font-display text-3xl font-bold tracking-wide text-white">
            Round {gameRoom.round}
          </h1>

          <div className={`mb-6 rounded-2xl border-2 p-6 ${isImposter ? "border-[var(--red)] bg-[#0d1220] shadow-[0_0_32px_rgba(239,68,68,0.35)]" : "border-[var(--green)] bg-[#0d1220] shadow-[0_0_32px_rgba(34,197,94,0.3)]"}`}>
            {isImposter ? (
              <div>
                <h2 className="mb-2 text-xl font-bold text-[var(--red)]">
                  🎭 You are the IMPOSTER!
                </h2>
                <p className="mb-3 text-[var(--text)]/90">
                  You don't know the secret{" "}
                  {gameRoom.gameType === "clashroyale" ? "card" : "hero"}. Try
                  to blend in by giving a clue that could apply to any{" "}
                  {gameRoom.gameType === "clashroyale"
                    ? "Clash Royale card"
                    : "Dota 2 hero"}
                  !
                </p>
                {gameRoom.hintsEnabled !== false &&
                  gameRoom.hints &&
                  gameRoom.hints.length > 0 && (
                    <div className="mt-3 rounded-xl bg-black/30 p-4">
                      <p className="mb-2 text-sm font-semibold text-[var(--gold)]">
                        💡 Hints to help you blend in:
                      </p>
                      <ul className="space-y-1 text-sm text-[var(--gold)]">
                        {gameRoom.hints.map((hint, idx) => (
                          <li key={idx}>
                            <span className="font-medium">{hint.type}:</span>{" "}
                            {hint.value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                {gameRoom.hintsEnabled === false && (
                  <div className="mt-3 rounded-xl bg-[var(--red)]/10 border border-[var(--red)]/30 p-3">
                    <p className="text-sm font-semibold text-[var(--red)]">
                      ⚠️ Hints are disabled - you have no clues about the secret{" "}
                      {gameRoom.gameType === "clashroyale" ? "card" : "hero"}!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h2 className="mb-2 text-xl font-bold text-[var(--green)]">
                  ✅ You know the{" "}
                  {gameRoom.gameType === "clashroyale" ? "card" : "hero"}!
                </h2>
                <div className="mb-2 flex items-center gap-4">
                  {gameRoom.gameType === "clashroyale" &&
                    gameRoom.currentCard?.iconUrls?.medium && (
                      <img
                        src={gameRoom.currentCard.iconUrls.medium}
                        alt={gameRoom.currentCard.name}
                        className="h-20 w-20 rounded-xl object-cover border border-[var(--border)]"
                      />
                    )}
                  <div>
                    <p className="text-lg font-bold text-[var(--text)]">
                      Secret{" "}
                      {gameRoom.gameType === "clashroyale" ? "Card" : "Hero"}:{" "}
                      {gameRoom.gameType === "clashroyale"
                        ? gameRoom.currentCard?.name
                        : gameRoom.currentHero?.name_english_loc}
                    </p>
                    {gameRoom.gameType === "clashroyale" &&
                      gameRoom.currentCard && (
                        <div className="mt-1 text-sm text-[var(--muted)]">
                          <span className="font-medium">Elixir Cost:</span>{" "}
                          {gameRoom.currentCard.elixirCost} |{" "}
                          {gameRoom.currentCard.rarity && (
                            <>
                              <span className="font-medium">Rarity:</span>{" "}
                              {gameRoom.currentCard.rarity}
                            </>
                          )}
                        </div>
                      )}
                  </div>
                </div>
                <p className="text-[var(--text)]/90">
                  Give a clue about this{" "}
                  {gameRoom.gameType === "clashroyale" ? "card" : "hero"}{" "}
                  without being too obvious. Try to identify the imposter!
                </p>
              </div>
            )}
          </div>

          {!hasSubmittedClue ? (
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-[var(--muted)]">
                Your Clue
              </label>
              <textarea
                value={clue}
                onChange={(e) => setClue(e.target.value)}
                placeholder={`Enter your clue about the ${gameRoom.gameType === "clashroyale" ? "card" : "hero"}...`}
                rows={4}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-3 text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--blue)] focus:outline-none focus:ring-2 focus:ring-[var(--blue-glow)]"
              />
              <button
                onClick={() => {
                  if (clue.trim()) {
                    onSubmitClue(clue.trim());
                    setClue("");
                    showToast("Clue submitted!");
                  }
                }}
                className="mt-4 w-full rounded-xl bg-[var(--blue)] px-4 py-4 font-display text-lg font-bold tracking-wide text-white transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Submit Clue
              </button>
            </div>
          ) : (
            <div className="mb-6 rounded-xl border border-[var(--green)] bg-[var(--green)]/10 p-4">
              <p className="font-semibold text-[var(--green)]">
                ✅ You submitted: "{currentPlayer.clue}"
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm text-[var(--muted)]">
                <span className="inline-flex gap-0.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)]" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)]" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)]" style={{ animationDelay: "300ms" }} />
                </span>
                Waiting for other players...
              </p>
            </div>
          )}

          <div className="mb-4">
            <h3 className="mb-2 font-display font-bold tracking-wide text-[var(--text)]">
              Submitted Clues ({gameRoom.clues.length} / {gameRoom.players.length})
            </h3>
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface2)]">
              <div
                className="h-full rounded-full bg-[var(--blue)] transition-all duration-500"
                style={{ width: `${(gameRoom.clues.length / gameRoom.players.length) * 100}%` }}
              />
            </div>
            <div className="space-y-2">
              {gameRoom.clues.map((clueData) => {
                const player = gameRoom.players.find(
                  (p) => p.id === clueData.playerId
                );
                return (
                  <div
                    key={clueData.playerId}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--blue)] to-purple-600 font-bold text-sm text-white">
                      {player?.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text)]">
                        {player?.name}
                      </p>
                      <p className="text-sm text-[var(--muted)]">
                        "{clueData.clue}"
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {isHost && onSkipPhase && gameRoom.clues.length > 0 && (
            <div className="mt-6">
              <button
                onClick={onSkipPhase}
                className="w-full rounded-xl border-2 border-[var(--gold)] bg-[var(--gold)]/10 px-4 py-3 font-semibold text-[var(--gold)] transition-colors hover:bg-[var(--gold)]/20"
              >
                ⏭️ Skip to Voting ({gameRoom.clues.length} clues submitted)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameRoom.gameState === "voting") {
    return (
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl">
          <div className="mb-6 text-center">
            <h1 className="mb-2 font-display text-3xl font-bold tracking-wide text-[var(--text)]">
              Vote for the Imposter
            </h1>
            {timeRemaining !== null && (
              <div className="mt-4">
                <div
                  className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full font-display text-3xl font-bold ${
                    timeRemaining <= 10
                      ? "bg-[var(--red)] text-white"
                      : timeRemaining <= 30
                      ? "bg-[var(--gold)] text-white"
                      : "bg-[var(--blue)] text-white"
                  }`}
                >
                  {timeRemaining}
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {timeRemaining > 0
                    ? "Time remaining to vote"
                    : "Time's up! Results will be shown soon..."}
                </p>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="mb-4 font-display text-xl font-bold tracking-wide text-[var(--text)]">
              Vote for the Imposter
            </h2>
            <div className="space-y-3">
              {gameRoom.players.map((player) => {
                const clueData = gameRoom.clues.find(
                  (c) => c.playerId === player.id
                );
                return (
                  <div
                    key={player.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--blue)] to-purple-600 font-bold text-white">
                        {player.name[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[var(--text)]">
                          {player.name}
                        </p>
                        {clueData ? (
                          <p className="text-sm text-[var(--muted)]">
                            "{clueData.clue}"
                          </p>
                        ) : (
                          <p className="text-sm italic text-[var(--muted)]">
                            No clue submitted
                          </p>
                        )}
                      </div>
                    </div>
                    {!hasVoted && (
                      <button
                        onClick={() => onVote(player.id)}
                        className="mt-3 w-full rounded-lg bg-[var(--red)]/20 px-4 py-2 text-sm font-semibold text-[var(--red)] transition-colors hover:bg-[var(--red)]/30"
                      >
                        Vote as Imposter
                      </button>
                    )}
                    {hasVoted &&
                      gameRoom.votes.some(
                        (v) =>
                          v.voterId === playerId && v.targetId === player.id
                      ) && (
                        <p className="mt-2 text-sm font-semibold text-[var(--green)]">
                          ✓ You voted for {player.name}
                        </p>
                      )}
                  </div>
                );
              })}
            </div>
          </div>

          {hasVoted && (
            <p className="mb-4 text-center text-[var(--muted)]">
              You've voted! Waiting for other players or timer to end...
            </p>
          )}

          {isHost && onSkipPhase && (
            <div className="mt-6">
              <button
                onClick={onSkipPhase}
                className="w-full rounded-xl border-2 border-[var(--gold)] bg-[var(--gold)]/10 px-4 py-3 font-semibold text-[var(--gold)] transition-colors hover:bg-[var(--gold)]/20"
              >
                ⏭️ End Voting & Show Results
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameRoom.gameState === "finished") {
    const voteCounts: { [key: string]: number } = {};
    gameRoom.votes.forEach((vote) => {
      voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
    });

    const mostVoted = Object.entries(voteCounts).sort(
      ([, a], [, b]) => b - a
    )[0];
    const votedOutPlayer = gameRoom.players.find(
      (p) => p.id === mostVoted?.[0]
    );
    const wasImposter = votedOutPlayer?.isImposter;

    // Show vote counts for each player
    const playerVoteCounts: Array<{
      player: (typeof gameRoom.players)[0];
      votes: number;
    }> = gameRoom.players.map((player) => ({
      player,
      votes: voteCounts[player.id] || 0,
    }));

    return (
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl">
          <h1 className="mb-6 text-center font-display text-3xl font-bold tracking-wide text-[var(--text)]">
            Game Over!
          </h1>

          <div className="mb-6 rounded-2xl border-2 border-[var(--border)] bg-[var(--surface2)] p-6">
            <div className="mb-2 flex items-center gap-4">
                {gameRoom.gameType === "clashroyale" &&
                gameRoom.currentCard?.iconUrls?.medium && (
                  <img
                    src={gameRoom.currentCard.iconUrls.medium}
                    alt={gameRoom.currentCard.name}
                    className="h-24 w-24 rounded-xl object-cover border border-[var(--border)]"
                  />
                )}
              <div>
                <p className="text-lg font-semibold text-[var(--text)]">
                  The secret{" "}
                  {gameRoom.gameType === "clashroyale" ? "card" : "hero"} was:{" "}
                  {gameRoom.gameType === "clashroyale"
                    ? gameRoom.currentCard?.name
                    : gameRoom.currentHero?.name_english_loc}
                </p>
              </div>
            </div>
            <p className="mb-4 text-lg font-semibold text-[var(--text)]">
              {votedOutPlayer?.name} was voted out!
            </p>
            {wasImposter ? (
              <p className="text-xl font-bold text-[var(--green)]">
                ✅ Correct! They were the imposter!
              </p>
            ) : (
              <p className="text-xl font-bold text-[var(--red)]">
                ❌ Wrong! They were not the imposter!
              </p>
            )}
          </div>

          <div className="mb-6">
            <h2 className="mb-4 font-display text-xl font-bold tracking-wide text-[var(--text)]">
              Voting Results
            </h2>
            <div className="space-y-2">
              {playerVoteCounts
                .sort(
                  (
                    a: { player: (typeof gameRoom.players)[0]; votes: number },
                    b: { player: (typeof gameRoom.players)[0]; votes: number }
                  ) => b.votes - a.votes
                )
                .map(
                  ({
                    player,
                    votes,
                  }: {
                    player: (typeof gameRoom.players)[0];
                    votes: number;
                  }) => (
                    <div
                      key={player.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-[var(--text)]">
                          {player.name}
                          {player.isImposter && (
                            <span className="ml-2 text-[var(--red)]">
                              🎭 Imposter
                            </span>
                          )}
                        </p>
                        <p className="text-sm font-medium text-[var(--muted)]">
                          {votes} vote{votes !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  )
                )}
            </div>
          </div>

          {isHost ? (
            <div className="space-y-3">
              {onNextRound && (
                <button
                  onClick={onNextRound}
                  className="w-full rounded-xl bg-[var(--blue)] px-4 py-4 font-display text-lg font-bold tracking-wide text-white transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  Next Round
                </button>
              )}
              {onResetGame && (
                <button
                  onClick={onResetGame}
                  className="w-full rounded-xl border border-[var(--border)] bg-transparent py-3 font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]"
                >
                  Go Home
                </button>
              )}
            </div>
          ) : (
            <p className="text-center text-[var(--muted)]">
              Waiting for host to start next round or end the game...
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
