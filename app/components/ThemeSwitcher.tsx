"use client";

import { useTheme } from "./ThemeContext";

const THEMES = [
  { id: "default" as const, label: "Default", icon: "◐" },
  { id: "cyberpunk" as const, label: "Cyberpunk", icon: "◆" },
  { id: "solarpunk" as const, label: "Solarpunk", icon: "🌿" },
] as const;

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-1.5 py-1 backdrop-blur-sm">
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            theme === t.id
              ? "bg-[var(--blue)] text-white shadow-sm"
              : "text-[var(--muted)] hover:bg-[var(--border)]/50 hover:text-[var(--text)]"
          }`}
          title={`Switch to ${t.label} theme`}
        >
          <span className="mr-1.5 opacity-80">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}
