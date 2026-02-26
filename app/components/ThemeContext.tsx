"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { motion } from "framer-motion";

export type DesignTheme = "default" | "cyberpunk" | "solarpunk";

const THEME_KEY = "imposter-theme";
const VALID_THEMES: DesignTheme[] = ["default", "cyberpunk", "solarpunk"];
const TRANSITION_MS = 400; // total: fade out 200ms, apply theme, fade in 200ms

const ThemeContext = createContext<{
  theme: DesignTheme;
  setTheme: (theme: DesignTheme) => void;
} | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<DesignTheme>("default");
  const [mounted, setMounted] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const pendingThemeRef = useRef<DesignTheme | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as DesignTheme | null;
    if (stored && VALID_THEMES.includes(stored)) {
      setThemeState(stored);
      document.documentElement.setAttribute("data-theme", stored);
    } else {
      document.documentElement.setAttribute("data-theme", "default");
    }
    setMounted(true);
  }, []);

  const setTheme = useCallback((t: DesignTheme) => {
    if (t === theme) return;

    pendingThemeRef.current = t;

    // Fade out → apply theme → fade in
    setOpacity(0);
    setTimeout(() => {
      const next = pendingThemeRef.current;
      if (next) {
        setThemeState(next);
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem(THEME_KEY, next);
        pendingThemeRef.current = null;
      }
      setOpacity(1);
    }, TRANSITION_MS / 2);
  }, [theme]);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [mounted, theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <motion.div
        animate={{ opacity }}
        transition={{ duration: TRANSITION_MS / 1000, ease: "easeInOut" }}
        style={{ minHeight: "100%", minWidth: "100%" }}
      >
        {children}
      </motion.div>
    </ThemeContext.Provider>
  );
}
