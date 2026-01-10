"use client";

import { useState, useEffect, useRef } from "react";
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900">
          <h1 className="mb-6 text-3xl font-bold text-center text-black dark:text-zinc-50">
            Round {gameRoom.round}
          </h1>

          <div className="mb-6 rounded-lg border-2 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
            {isImposter ? (
              <div>
                <h2 className="mb-2 text-xl font-semibold text-red-600 dark:text-red-400">
                  🎭 You are the IMPOSTER!
                </h2>
                <p className="mb-3 text-zinc-700 dark:text-zinc-300">
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
                    <div className="mt-3 rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900/20">
                      <p className="mb-2 text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                        💡 Hints to help you blend in:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
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
                  <div className="mt-3 rounded-lg bg-red-100 p-3 dark:bg-red-900/20">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                      ⚠️ Hints are disabled - you have no clues about the secret{" "}
                      {gameRoom.gameType === "clashroyale" ? "card" : "hero"}!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h2 className="mb-2 text-xl font-semibold text-green-600 dark:text-green-400">
                  ✅ You know the{" "}
                  {gameRoom.gameType === "clashroyale" ? "card" : "hero"}!
                </h2>
                <div className="mb-2 flex items-center gap-4">
                  {gameRoom.gameType === "clashroyale" &&
                    gameRoom.currentCard?.iconUrls?.medium && (
                      <img
                        src={gameRoom.currentCard.iconUrls.medium}
                        alt={gameRoom.currentCard.name}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    )}
                  <div>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      Secret{" "}
                      {gameRoom.gameType === "clashroyale" ? "Card" : "Hero"}:{" "}
                      {gameRoom.gameType === "clashroyale"
                        ? gameRoom.currentCard?.name
                        : gameRoom.currentHero?.name_english_loc}
                    </p>
                    {gameRoom.gameType === "clashroyale" &&
                      gameRoom.currentCard && (
                        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
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
                <p className="text-zinc-700 dark:text-zinc-300">
                  Give a clue about this{" "}
                  {gameRoom.gameType === "clashroyale" ? "card" : "hero"}{" "}
                  without being too obvious. Try to identify the imposter!
                </p>
              </div>
            )}
          </div>

          {!hasSubmittedClue ? (
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Your Clue
              </label>
              <textarea
                value={clue}
                onChange={(e) => setClue(e.target.value)}
                placeholder="Enter your clue about the hero..."
                rows={4}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-black focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
              />
              <button
                onClick={() => {
                  if (clue.trim()) {
                    onSubmitClue(clue.trim());
                    setClue("");
                  }
                }}
                className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Submit Clue
              </button>
            </div>
          ) : (
            <div className="mb-6 rounded-lg border border-green-500 bg-green-50 p-4 dark:bg-green-900/20">
              <p className="text-green-700 dark:text-green-300">
                ✅ You submitted: "{currentPlayer.clue}"
              </p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Waiting for other players to submit their clues...
              </p>
            </div>
          )}

          <div className="mb-4">
            <h3 className="mb-2 text-lg font-semibold text-black dark:text-zinc-50">
              Submitted Clues ({gameRoom.clues.length} /{" "}
              {gameRoom.players.length})
            </h3>
            <div className="space-y-2">
              {gameRoom.clues.map((clueData) => {
                const player = gameRoom.players.find(
                  (p) => p.id === clueData.playerId
                );
                return (
                  <div
                    key={clueData.playerId}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      {player?.name}:
                    </p>
                    <p className="text-black dark:text-zinc-50">
                      "{clueData.clue}"
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {isHost && onSkipPhase && gameRoom.clues.length > 0 && (
            <div className="mt-6">
              <button
                onClick={onSkipPhase}
                className="w-full rounded-lg border-2 border-orange-500 bg-orange-50 px-4 py-3 font-semibold text-orange-700 transition-colors hover:bg-orange-100 dark:border-orange-400 dark:bg-orange-900/20 dark:text-orange-300 dark:hover:bg-orange-900/30"
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-3xl font-bold text-black dark:text-zinc-50">
              Vote for the Imposter
            </h1>
            {timeRemaining !== null && (
              <div className="mt-4">
                <div
                  className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold ${
                    timeRemaining <= 10
                      ? "bg-red-500 text-white"
                      : timeRemaining <= 30
                      ? "bg-orange-500 text-white"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {timeRemaining}
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {timeRemaining > 0
                    ? "Time remaining to vote"
                    : "Time's up! Results will be shown soon..."}
                </p>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
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
                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <div className="mb-2">
                      <p className="font-semibold text-black dark:text-zinc-50">
                        {player.name}
                      </p>
                    </div>
                    {clueData ? (
                      <p className="text-zinc-700 dark:text-zinc-300">
                        "{clueData.clue}"
                      </p>
                    ) : (
                      <p className="text-sm italic text-zinc-500 dark:text-zinc-400">
                        No clue submitted
                      </p>
                    )}
                    {!hasVoted && (
                      <button
                        onClick={() => onVote(player.id)}
                        className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                      >
                        Vote as Imposter
                      </button>
                    )}
                    {hasVoted &&
                      gameRoom.votes.some(
                        (v) =>
                          v.voterId === playerId && v.targetId === player.id
                      ) && (
                        <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                          ✓ You voted for {player.name}
                        </p>
                      )}
                  </div>
                );
              })}
            </div>
          </div>

          {hasVoted && (
            <p className="mb-4 text-center text-zinc-600 dark:text-zinc-400">
              You've voted! Waiting for other players or timer to end...
            </p>
          )}

          {isHost && onSkipPhase && (
            <div className="mt-6">
              <button
                onClick={onSkipPhase}
                className="w-full rounded-lg border-2 border-orange-500 bg-orange-50 px-4 py-3 font-semibold text-orange-700 transition-colors hover:bg-orange-100 dark:border-orange-400 dark:bg-orange-900/20 dark:text-orange-300 dark:hover:bg-orange-900/30"
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900">
          <h1 className="mb-6 text-3xl font-bold text-center text-black dark:text-zinc-50">
            Game Over!
          </h1>

          <div className="mb-6 rounded-lg border-2 p-4 bg-zinc-50 dark:bg-zinc-800">
            <div className="mb-2 flex items-center gap-4">
              {gameRoom.gameType === "clashroyale" &&
                gameRoom.currentCard?.iconUrls?.medium && (
                  <img
                    src={gameRoom.currentCard.iconUrls.medium}
                    alt={gameRoom.currentCard.name}
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                )}
              <div>
                <p className="text-lg font-semibold text-black dark:text-zinc-50">
                  The secret{" "}
                  {gameRoom.gameType === "clashroyale" ? "card" : "hero"} was:{" "}
                  {gameRoom.gameType === "clashroyale"
                    ? gameRoom.currentCard?.name
                    : gameRoom.currentHero?.name_english_loc}
                </p>
              </div>
            </div>
            <p className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
              {votedOutPlayer?.name} was voted out!
            </p>
            {wasImposter ? (
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                ✅ Correct! They were the imposter!
              </p>
            ) : (
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                ❌ Wrong! They were not the imposter!
              </p>
            )}
          </div>

          <div className="mb-6">
            <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
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
                      className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-black dark:text-zinc-50">
                          {player.name}
                          {player.isImposter && (
                            <span className="ml-2 text-red-600 dark:text-red-400">
                              🎭 Imposter
                            </span>
                          )}
                        </p>
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
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
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Next Round
                </button>
              )}
              {onResetGame && (
                <button
                  onClick={onResetGame}
                  className="w-full rounded-lg border-2 border-zinc-300 bg-white px-4 py-3 font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Go Home
                </button>
              )}
            </div>
          ) : (
            <p className="text-center text-zinc-600 dark:text-zinc-400">
              Waiting for host to start next round or end the game...
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
