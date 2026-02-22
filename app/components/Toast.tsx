"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
}

export default function Toast({ message, visible, onHide }: ToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      const t = setTimeout(onHide, 2400);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setMounted(false), 350);
      return () => clearTimeout(t);
    }
  }, [visible, onHide]);

  if (!mounted && !visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-7 left-1/2 z-[999] -translate-x-1/2 whitespace-nowrap rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-6 py-3 text-sm font-semibold text-[var(--text)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-20 opacity-0"
      }`}
    >
      {message}
    </div>
  );
}
