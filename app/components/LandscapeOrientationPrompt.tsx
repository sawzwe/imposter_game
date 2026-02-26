"use client";

import { useState, useEffect } from "react";
import { RotateCw } from "lucide-react";

/**
 * Prompts mobile users to rotate to landscape for better Heads Up experience.
 * Shown when device is in portrait and width suggests mobile.
 */
export default function LandscapeOrientationPrompt() {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const portrait = typeof window !== "undefined" && window.innerHeight > window.innerWidth;
      const mobile = typeof window !== "undefined" && window.innerWidth < 768;
      setIsPortrait(portrait);
      setIsMobile(mobile);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  if (!isMobile || !isPortrait) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--bg)] p-6 md:hidden">
      <RotateCw
        className="mb-6 h-20 w-20 animate-pulse text-[var(--blue)]"
        strokeWidth={1.5}
      />
      <h2 className="mb-2 font-display text-2xl font-bold text-[var(--text)]">
        Rotate to landscape
      </h2>
      <p className="max-w-xs text-center text-sm text-[var(--muted)]">
        Turn your phone sideways for the best Heads Up experience. The card will
        be easier for others to see.
      </p>
    </div>
  );
}
