import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { ToastProvider } from "./components/ToastContext";
import { ThemeProvider } from "./components/ThemeContext";
import AppFooter from "./components/AppFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Imposter Game",
  description:
    "A multiplayer word-based imposter game with Dota 2 heroes and Clash Royale cards",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("imposter-theme");document.documentElement.setAttribute("data-theme",["default","cyberpunk","solarpunk"].includes(t)?t:"default");var h=location.pathname==="/"?"3.5rem":"0px";document.documentElement.style.setProperty("--header-height",h)})();`,
          }}
        />
        <ThemeProvider>
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
            <AppFooter />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
