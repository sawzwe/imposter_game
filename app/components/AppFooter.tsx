"use client";

import packageJson from "../../package.json";
import ThemeSwitcher from "./ThemeSwitcher";

export default function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <>
      <footer className="pointer-events-none fixed bottom-3 left-0 right-0 z-10 flex flex-col items-center gap-3">
        {/* Theme switcher — needs pointer events */}
        <div className="pointer-events-auto">
          <ThemeSwitcher />
        </div>
        {/* Branding — copyright, version, creator */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
          <span>© {year} Imposter</span>
          <span className="text-[var(--border)]">·</span>
          <span className="font-medium tabular-nums">v{packageJson.version}</span>
          <span className="text-[var(--border)]">·</span>
          <span>
            by{" "}
            <a
              href="https://github.com/sawzwe"
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto font-medium text-[var(--blue)] hover:underline"
            >
              @sawzwe
            </a>
          </span>
        </div>
      </footer>
      {/* About / Contact — bottom-right corner */}
      <div className="pointer-events-auto fixed bottom-3 right-3 z-10 flex items-center gap-2">
        <a
          href="/about"
          className="text-[10px] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          title="About the team"
        >
          About
        </a>
        <span className="text-[var(--border)]">·</span>
        <a
          href="mailto:sawzwe.matthew.md@gmail.com"
          className="text-[10px] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          title="Contact"
        >
          Contact
        </a>
      </div>
    </>
  );
}
