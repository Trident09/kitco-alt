"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function BackToDashboard() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return (
      <Link
        href="/dashboard"
        className="text-sm font-medium px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors flex items-center gap-1.5"
      >
        <span className="text-violet-200 text-xs">⊞</span>
        My Stashes
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="text-sm font-medium px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
    >
      Get started
    </Link>
  );
}
