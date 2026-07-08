"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function NotFound() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">

      {/* Illustration */}
      <div className="relative mb-10">
        <svg
          viewBox="0 0 160 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-40 h-30 text-violet-500/30"
        >
          {/* Grid backdrop */}
          {Array.from({ length: 5 }, (_, row) =>
            Array.from({ length: 8 }, (_, col) => (
              <circle
                key={`${row}-${col}`}
                cx={16 + col * 18}
                cy={16 + row * 22}
                r="1.5"
                fill="currentColor"
                opacity={0.3 + (row + col) * 0.03}
              />
            ))
          )}
          {/* Broken frame */}
          <rect x="40" y="20" width="80" height="60" rx="8" stroke="currentColor" strokeWidth="2" opacity="0.35" fill="none" />
          <line x1="40" y1="35" x2="120" y2="35" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
          {/* Question mark */}
          <text x="80" y="72" textAnchor="middle" fontSize="28" fontWeight="700" fill="currentColor" opacity="0.45" fontFamily="monospace">?</text>
          {/* Orbiting dot */}
          <circle cx="128" cy="22" r="4" fill="currentColor" opacity="0.5" />
          <circle cx="32" cy="90" r="3" fill="currentColor" opacity="0.3" />
        </svg>
      </div>

      {/* 404 */}
      <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-400/70 mb-3">
        404 · Not found
      </p>
      <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
        This page doesn&apos;t exist
      </h1>
      <p className="text-sm text-muted max-w-xs leading-relaxed mb-10">
        The page you&apos;re looking for may have been moved, deleted, or never existed in the first place.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {!loading && (
          <>
            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
              >
                <span className="text-violet-200 text-xs">⊞</span>
                Go to My Stashes
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
              >
                Get started
              </Link>
            )}
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl border border-border text-sm text-muted hover:text-foreground hover:border-violet-500/40 transition-colors"
            >
              ← Back to Home
            </Link>
          </>
        )}
      </div>

      {/* Footer credit */}
      <p className="absolute bottom-6 text-[11px] text-muted/40">
        © {new Date().getFullYear()} Stashly
      </p>
    </div>
  );
}
