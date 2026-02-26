"use client";

import Link from "next/link";

export default function HeadsUpSelectPage() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="gradient-text mb-2 text-center font-display text-3xl font-bold tracking-wide">
        Heads Up
      </h1>
      <p className="mb-8 text-center text-sm text-[var(--muted)]">
        Hold device to forehead. Others see the card. Ask yes/no questions!
      </p>
      <div className="grid w-full max-w-md grid-cols-2 gap-4">
        <Link
          href="/headsup/dota"
          className="animate-game-select-in group flex flex-col items-center rounded-2xl border-2 border-[var(--border)] bg-[var(--surface2)] p-8 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-[var(--blue)] hover:shadow-[0_0_32px_var(--blue-glow)] active:scale-[0.98]"
        >
          <span className="mb-3 text-4xl transition-transform duration-300 group-hover:scale-110">
            ⚔️
          </span>
          <span className="font-display text-xl font-bold text-[var(--text)]">
            Dota 2
          </span>
          <span className="mt-1 text-sm text-[var(--muted)]">Heroes</span>
        </Link>
        <Link
          href="/headsup/clash"
          className="animate-game-select-in-delay-1 group flex flex-col items-center rounded-2xl border-2 border-[var(--border)] bg-[var(--surface2)] p-8 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-[var(--blue)] hover:shadow-[0_0_32px_var(--blue-glow)] active:scale-[0.98]"
        >
          <span className="mb-3 text-4xl transition-transform duration-300 group-hover:scale-110">
            👑
          </span>
          <span className="font-display text-xl font-bold text-[var(--text)]">
            Clash Royale
          </span>
          <span className="mt-1 text-sm text-[var(--muted)]">Cards</span>
        </Link>
      </div>
      <Link
        href="/"
        className="mt-8 rounded-xl border border-[var(--border)] px-6 py-3 font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]"
      >
        ← Back
      </Link>
    </div>
  );
}
