import { Suspense } from "react";
import PlayClient from "./PlayClient";

export default function PlayPage() {
  return (
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
      <PlayClient />
    </Suspense>
  );
}
