"use client";

import { useState, useEffect } from "react";
import { GameRoom } from "../types";
import LandscapeOrientationPrompt from "./LandscapeOrientationPrompt";
import { Hero } from "../types";

function getHeroImageUrl(hero: Hero): string {
  const shortName = hero.name.replace("npc_dota_hero_", "");
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${shortName}.png`;
}

interface HeadsUpMultiScreenProps {
  gameRoom: GameRoom;
  playerId: string;
  onLeaveRoom?: () => void;
}

export default function HeadsUpMultiScreen({
  gameRoom,
  playerId,
  onLeaveRoom,
}: HeadsUpMultiScreenProps) {
  const currentPlayer = gameRoom.players.find((p) => p.id === playerId);
  const [countdown, setCountdown] = useState<number | null>(null);

  const endTime = gameRoom.headsupCountdownEnd ?? 0;
  const isCountdownPhase =
    gameRoom.gameState === "headsup_countdown" && Date.now() < endTime;

  useEffect(() => {
    if (!endTime) return;

    const tick = () => {
      const remaining = Math.ceil((endTime - Date.now()) / 1000);
      setCountdown(remaining > 0 ? remaining : null);
    };

    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [endTime]);

  if (!currentPlayer) return null;

  const myHero = currentPlayer.hero;
  const myCard = currentPlayer.card;
  const displayName =
    gameRoom.gameType === "dota2"
      ? myHero?.name_english_loc
      : myCard?.name;
  const imageUrl =
    gameRoom.gameType === "dota2" && myHero
      ? getHeroImageUrl(myHero)
      : myCard?.iconUrls?.medium;

  // Countdown phase
  if (isCountdownPhase && countdown !== null && countdown > 0) {
    return (
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6">
        <LandscapeOrientationPrompt />
        <div className="text-center">
          <p className="mb-4 text-sm text-[var(--muted)]">
            Get ready! Turn your phone around when the countdown ends
          </p>
          <div className="font-display text-8xl font-bold text-[var(--blue)] animate-headsup-card-in">
            {countdown}
          </div>
          <p className="mt-6 text-sm text-[var(--muted)]">
            Others will see your character. Ask yes/no questions to guess!
          </p>
        </div>
      </div>
    );
  }

  // Character display - turn phone so others can see
  return (
    <div className="relative z-10 flex min-h-screen flex-col p-4 md:p-6">
      <LandscapeOrientationPrompt />
      <div className="absolute right-4 top-4">
        {onLeaveRoom && (
          <button
            onClick={onLeaveRoom}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]"
          >
            Leave
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="mb-4 text-center text-sm font-semibold text-[var(--gold)]">
          👆 Turn your phone around — others can see your character
        </p>
        <p className="mb-6 text-center text-xs text-[var(--muted)]">
          Don&apos;t look! Ask yes/no questions. Others will answer.
        </p>

        <div
          key="headsup-char"
          className="flex w-full max-w-lg flex-col items-center justify-center rounded-2xl border-2 border-[var(--blue)] bg-[#0d1220] p-8 shadow-[0_0_40px_var(--blue-glow)] animate-headsup-card-in md:flex-row md:gap-8 md:p-10"
        >
          {imageUrl && (
            <div className="mb-4 flex-shrink-0 md:mb-0">
              <img
                src={imageUrl}
                alt={displayName || ""}
                className="h-36 w-36 rounded-xl border-2 border-[var(--border)] object-cover md:h-44 md:w-44"
              />
            </div>
          )}
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--muted-on-dark)]">
              {gameRoom.gameType === "dota2" ? "Hero" : "Card"}
            </p>
            <h2 className="font-display text-4xl font-bold text-[var(--text-on-dark)] md:text-5xl">
              {displayName || "???"}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}
