"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthModal from "@/app/components/AuthModal";

export default function AuthSignupClient() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--blue)]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <AuthModal isOpen={true} onClose={() => router.push("/")} defaultTab="signup" />
    </div>
  );
}
