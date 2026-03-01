"use client";

import { useState } from "react";
import { supabaseClient } from "../lib/supabaseClient";

type Tab = "login" | "signup";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: Tab;
}

export default function AuthModal({
  isOpen,
  onClose,
  defaultTab = "login",
}: AuthModalProps) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setError(null);
    setEmail("");
    setPassword("");
  };

  const handleClose = () => {
    resetForm();
    setTab(defaultTab);
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = supabaseClient();
    if (!supabase) {
      setError("Auth not configured");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    handleClose();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = supabaseClient();
    if (!supabase) {
      setError("Auth not configured");
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setError(null);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === "login"
                  ? "bg-[var(--blue)] text-white"
                  : "bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("signup");
                setError(null);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === "signup"
                  ? "bg-[var(--blue)] text-white"
                  : "bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              Sign Up
            </button>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={tab === "login" ? handleLogin : handleSignUp}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="auth-email"
              className="mb-1.5 block text-sm font-medium text-[var(--text)]"
            >
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-3 text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--blue)] focus:outline-none focus:ring-2 focus:ring-[var(--blue-glow)]"
            />
          </div>
          <div>
            <label
              htmlFor="auth-password"
              className="mb-1.5 block text-sm font-medium text-[var(--text)]"
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-3 text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--blue)] focus:outline-none focus:ring-2 focus:ring-[var(--blue-glow)]"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--blue)] px-4 py-3 font-display font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {tab === "login" ? "Signing in..." : "Creating account..."}
              </>
            ) : tab === "login" ? (
              "Log in"
            ) : (
              "Sign up"
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-[var(--border)] pt-4">
          <p className="mb-3 text-center text-xs text-[var(--muted)]">
            Or continue with
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface2)] py-2.5 text-sm font-medium text-[var(--muted)] opacity-60 cursor-not-allowed"
            >
              Google (coming soon)
            </button>
            <button
              type="button"
              disabled
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface2)] py-2.5 text-sm font-medium text-[var(--muted)] opacity-60 cursor-not-allowed"
            >
              Discord (coming soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
