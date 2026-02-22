import type { Metadata } from "next";
import { Suspense } from "react";
import { ToastProvider } from "./components/ToastContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Imposter Game",
  description:
    "A multiplayer word-based imposter game with Dota 2 heroes and Clash Royale cards",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ToastProvider>
          <Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--blue)]" />
                  <p className="text-[var(--muted)]">Loading...</p>
                </div>
              </div>
            }
          >
            {children}
          </Suspense>
        </ToastProvider>
      </body>
    </html>
  );
}
