"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Moon, Sparkles, Leaf } from "lucide-react";
import { useTheme } from "./ThemeContext";

const THEMES = [
  { id: "default" as const, label: "Default", Icon: Moon },
  { id: "cyberpunk" as const, label: "Cyberpunk", Icon: Sparkles },
  { id: "solarpunk" as const, label: "Solarpunk", Icon: Leaf },
] as const;

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]/90 text-[var(--muted)] shadow-lg backdrop-blur-sm transition-all hover:bg-[var(--surface2)] hover:text-[var(--text)]"
        title="Change theme"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Palette className="h-5 w-5" strokeWidth={2} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 top-full z-50 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl backdrop-blur-md"
            role="menu"
          >
            <div className="py-1">
              {THEMES.map((t) => {
                const Icon = t.Icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                      theme === t.id
                        ? "bg-[var(--blue)]/20 font-semibold text-[var(--blue)]"
                        : "text-[var(--muted)] hover:bg-[var(--border)]/30 hover:text-[var(--text)]"
                    }`}
                    role="menuitem"
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
