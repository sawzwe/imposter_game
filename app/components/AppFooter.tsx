"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import packageJson from "../../package.json";
import ThemeSwitcher from "./ThemeSwitcher";

export default function AppFooter() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  // Only show top bar on landing page — game screens have their own nav (Back, etc.)
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--header-height",
      isLanding ? "3.5rem" : "0px",
    );
    return () => {
      document.documentElement.style.removeProperty("--header-height");
    };
  }, [isLanding]);

  if (!isLanding) return null;

  const year = new Date().getFullYear();

  return (
    <>
      {/* Top bar — theme, branding, About/Contact — only on landing page */}
      <header className="pointer-events-none fixed left-0 right-0 top-0 z-20 flex items-center justify-between px-4 py-2">
        <div className="pointer-events-auto flex items-center gap-3">
          <ThemeSwitcher />
          <div className="hidden items-center gap-x-2 text-xs text-[var(--muted)] sm:flex">
            <span>© {year} Imposter</span>
            <span className="text-[var(--border)]">·</span>
            <span className="font-medium tabular-nums">
              v{packageJson.version}
            </span>
            <span className="text-[var(--border)]">·</span>
            <a
              href="https://github.com/sawzwe"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--blue)] hover:underline"
            >
              @sawzwe
            </a>
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <a
            href="/about"
            className="text-[10px] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            title="About"
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
      </header>
    </>
  );
}
