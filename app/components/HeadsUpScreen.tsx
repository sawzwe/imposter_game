"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "./ToastContext";
import { Hero, ClashRoyaleCard } from "../types";
import { GameType } from "../types";

// Dota 2 hero image URL from internal name (npc_dota_hero_antimage -> antimage)
function getHeroImageUrl(hero: Hero): string {
  const shortName = hero.name.replace("npc_dota_hero_", "");
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${shortName}.png`;
}

interface HeadsUpScreenProps {
  onBack: () => void;
}

export default function HeadsUpScreen({ onBack }: HeadsUpScreenProps) {
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [currentCard, setCurrentCard] = useState<
    (Hero & { type: "hero" }) | (ClashRoyaleCard & { type: "card" }) | null
  >(null);
  const [round, setRound] = useState(0);
  const [gotItCount, setGotItCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const { showToast } = useToast();

  const fetchRandomHero = useCallback(async () => {
    const res = await fetch("/api/heroes");
    const data = await res.json();
    const heroes: Hero[] = data.result?.data?.heroes || [];
    if (heroes.length === 0) return null;
    const hero = heroes[Math.floor(Math.random() * heroes.length)];
    return { ...hero, type: "hero" as const };
  }, []);

  const fetchRandomCard = useCallback(async () => {
    const res = await fetch("/api/clash-royale/cards");
    const data = await res.json();
    const items = data.items || [];
    if (items.length === 0) return null;
    const card = items[Math.floor(Math.random() * items.length)];
    return { ...card, type: "card" as const };
  }, []);

  const loadNextCard = useCallback(async () => {
    if (!gameType) return;
    setIsLoading(true);
    try {
      const item =
        gameType === "dota2"
          ? await fetchRandomHero()
          : await fetchRandomCard();
      if (item) {
        setCardKey((k) => k + 1);
        setCurrentCard(item);
        setRound((r) => r + 1);
      } else {
        showToast("Could not load characters");
      }
    } catch (e) {
      showToast("Failed to load");
    } finally {
      setIsLoading(false);
    }
  }, [gameType, fetchRandomHero, fetchRandomCard, showToast]);

  useEffect(() => {
    if (gameType && round === 0) {
      loadNextCard();
    }
  }, [gameType, round]); // eslint-disable-line react-hooks/exhaustive-deps

  const [justGotIt, setJustGotIt] = useState(false);

  const handleGotIt = () => {
    setGotItCount((c) => c + 1);
    setJustGotIt(true);
    setTimeout(() => setJustGotIt(false), 500);
    showToast("Got it!");
    loadNextCard();
  };

  const handleSkip = () => {
    loadNextCard();
  };

  const handleNext = () => {
    loadNextCard();
  };

  // Game type selection
  if (gameType === null) {
    return (
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6">
        <h1 className="gradient-text mb-2 text-center font-['Rajdhani'] text-3xl font-bold tracking-wide">
          Heads Up
        </h1>
        <p className="mb-8 text-center text-sm text-[var(--muted)]">
          Hold device to forehead. Others see the card. Ask yes/no questions!
        </p>
        <div className="grid w-full max-w-md grid-cols-2 gap-4">
          <button
            onClick={() => setGameType("dota2")}
            className="animate-game-select-in group flex flex-col items-center rounded-2xl border-2 border-[var(--border)] bg-[var(--surface2)] p-8 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-[var(--blue)] hover:shadow-[0_0_32px_var(--blue-glow)] active:scale-[0.98]"
          >
            <span className="mb-3 text-4xl transition-transform duration-300 group-hover:scale-110">
              ⚔️
            </span>
            <span className="font-['Rajdhani'] text-xl font-bold text-[var(--text)]">
              Dota 2
            </span>
            <span className="mt-1 text-sm text-[var(--muted)]">Heroes</span>
          </button>
          <button
            onClick={() => setGameType("clashroyale")}
            className="animate-game-select-in-delay-1 group flex flex-col items-center rounded-2xl border-2 border-[var(--border)] bg-[var(--surface2)] p-8 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-[var(--blue)] hover:shadow-[0_0_32px_var(--blue-glow)] active:scale-[0.98]"
          >
            <span className="mb-3 text-4xl transition-transform duration-300 group-hover:scale-110">
              👑
            </span>
            <span className="font-['Rajdhani'] text-xl font-bold text-[var(--text)]">
              Clash Royale
            </span>
            <span className="mt-1 text-sm text-[var(--muted)]">Cards</span>
          </button>
        </div>
        <button
          onClick={onBack}
          className="mt-8 rounded-xl border border-[var(--border)] py-3 px-6 font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]"
        >
          ← Back
        </button>
      </div>
    );
  }

  // Card display
  const displayName =
    currentCard?.type === "hero"
      ? (currentCard as Hero).name_english_loc
      : (currentCard as ClashRoyaleCard)?.name;

  const imageUrl =
    currentCard?.type === "hero"
      ? getHeroImageUrl(currentCard as Hero)
      : (currentCard as ClashRoyaleCard)?.iconUrls?.medium;

  // Loading skeleton while first card loads
  if (round === 0 && isLoading) {
    return (
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6">
        <button
          onClick={onBack}
          className="absolute left-4 top-4 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]"
        >
          ← Home
        </button>
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--blue)]" />
        <p className="mt-4 text-[var(--muted)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex min-h-screen flex-col p-4 md:p-6">
      {/* Round & score */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--muted)] transition-all hover:bg-[var(--surface2)] hover:text-[var(--text)] active:scale-95"
        >
          ← Home
        </button>
        <div className="flex gap-4">
          <span className="rounded-lg bg-[var(--surface2)] px-3 py-1 font-['Rajdhani'] font-bold text-[var(--text)]">
            Round {round}
          </span>
          <span
            className={`rounded-lg bg-[var(--green)]/20 px-3 py-1 font-['Rajdhani'] font-bold text-[var(--green)] transition-transform ${
              justGotIt ? "animate-btn-pop" : ""
            }`}
          >
            ✓ {gotItCount}
          </span>
        </div>
      </div>

      {/* Card area - responsive for portrait & landscape */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <div
          key={cardKey}
          className="flex w-full max-w-lg flex-col items-center justify-center rounded-2xl border-2 border-[var(--blue)] bg-[#0d1220] p-6 shadow-[0_0_40px_var(--blue-glow)] animate-headsup-card-in md:flex-row md:gap-8 md:p-8"
        >
          {imageUrl && (
            <div className="mb-4 flex-shrink-0 md:mb-0">
              <img
                src={imageUrl}
                alt={displayName || ""}
                className="h-32 w-32 rounded-xl object-cover border-2 border-[var(--border)] md:h-40 md:w-40"
              />
            </div>
          )}
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--muted)]">
              {gameType === "dota2" ? "Hero" : "Card"}
            </p>
            <h2 className="font-['Rajdhani'] text-3xl font-bold text-[var(--text)] md:text-4xl">
              {displayName || "Loading..."}
            </h2>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Ask yes/no questions. Others can see your card and answer.
        </p>
      </div>

      {/* Buttons */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <button
          onClick={handleGotIt}
          disabled={isLoading}
          className="group flex flex-col items-center gap-1 rounded-xl border-2 border-[var(--green)] bg-[var(--green)]/20 py-4 font-['Rajdhani'] font-bold text-[var(--green)] transition-all duration-200 hover:scale-105 hover:bg-[var(--green)]/30 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] active:scale-95 disabled:opacity-50"
        >
          <span className="text-2xl">✓</span>
          <span>Got it!</span>
        </button>
        <button
          onClick={handleSkip}
          disabled={isLoading}
          className="group flex flex-col items-center gap-1 rounded-xl border-2 border-[var(--gold)] bg-[var(--gold)]/20 py-4 font-['Rajdhani'] font-bold text-[var(--gold)] transition-all duration-200 hover:scale-105 hover:bg-[var(--gold)]/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95 disabled:opacity-50"
        >
          <span className="text-2xl">⏭</span>
          <span>Skip</span>
        </button>
        <button
          onClick={handleNext}
          disabled={isLoading}
          className="group flex flex-col items-center gap-1 rounded-xl border-2 border-[var(--blue)] bg-[var(--blue)]/20 py-4 font-['Rajdhani'] font-bold text-[#5b8fff] transition-all duration-200 hover:scale-105 hover:bg-[var(--blue)]/30 hover:shadow-[0_0_20px_var(--blue-glow)] active:scale-95 disabled:opacity-50"
        >
          <span className="text-2xl">→</span>
          <span>Next</span>
        </button>
      </div>
    </div>
  );
}
