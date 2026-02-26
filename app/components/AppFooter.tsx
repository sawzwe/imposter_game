"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";
import packageJson from "../../package.json";
import ThemeSwitcher from "./ThemeSwitcher";

export default function AppFooter() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Nav bar at bottom on landing page — prevents scroll, doesn't obscure content
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--footer-height",
      isLanding ? "3rem" : "0px",
    );
    return () => {
      document.documentElement.style.removeProperty("--footer-height");
    };
  }, [isLanding]);

  if (!isLanding) return null;

  const year = new Date().getFullYear();

  return (
    <>
      {/* Bottom bar — theme + info always visible, branding hides on narrow screens */}
      <footer className="pointer-events-none fixed bottom-0 left-0 right-0 z-20 flex min-w-0 items-center justify-between gap-2 bg-[var(--bg)]/95 px-3 py-2 backdrop-blur-sm sm:px-4">
        <div className="pointer-events-auto flex shrink-0 items-center gap-2">
          <ThemeSwitcher openAbove />
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setIsMenuOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]/90 text-[var(--muted)] shadow-lg backdrop-blur-sm transition-all hover:bg-[var(--surface2)] hover:text-[var(--text)]"
              title="More"
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
            >
              <Info className="h-5 w-5" strokeWidth={2} />
            </button>
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute left-0 bottom-full z-50 mb-2 min-w-[140px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl backdrop-blur-md"
                  role="menu"
                >
                  <div className="py-1">
                    <a
                      href="/about"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[var(--muted)] transition-colors hover:bg-[var(--border)]/30 hover:text-[var(--text)]"
                      role="menuitem"
                    >
                      About
                    </a>
                    <a
                      href="mailto:sawzwe.matthew.md@gmail.com"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[var(--muted)] transition-colors hover:bg-[var(--border)]/30 hover:text-[var(--text)]"
                      role="menuitem"
                    >
                      Contact
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="pointer-events-auto hidden min-w-0 shrink items-center justify-end gap-x-2 truncate text-xs text-[var(--muted)] md:flex">
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
      </footer>
    </>
  );
}
