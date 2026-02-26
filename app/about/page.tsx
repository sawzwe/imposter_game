import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
        <h1 className="gradient-text mb-4 text-center font-display text-2xl font-bold">
          About Imposter
        </h1>
        <p className="mb-6 text-center text-sm text-[var(--muted)]">
          A multiplayer party game with Dota 2 heroes and Clash Royale cards.
          Play Imposter, Heads Up, or Online Heads Up with friends.
        </p>
        <div className="space-y-3 text-sm text-[var(--text)]">
          <p>
            <strong>Team:</strong> Built by{" "}
            <a
              href="https://github.com/sawzwe"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--blue)] hover:underline"
            >
              @sawzwe
            </a>
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:sawzwe.matthew.md@gmail.com"
              className="text-[var(--blue)] hover:underline"
            >
              Email
            </a>
            <a
              href="https://github.com/sawzwe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--blue)] hover:underline"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/saw-zwe/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--blue)] hover:underline"
            >
              LinkedIn
            </a>
          </div>
        </div>
        <Link
          href="/"
          className="mt-6 block w-full rounded-xl border border-[var(--border)] py-3 text-center text-sm font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)]"
        >
          ← Back
        </Link>
      </div>
    </div>
  );
}
