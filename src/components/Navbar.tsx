"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav
      className="flex items-center justify-between px-6 py-4 border-b"
      style={{ background: "var(--surface)" }}
    >
      <Link href="/dashboard" className="text-xl font-bold" style={{ color: "var(--purple-light)" }}>
        Shelfie
      </Link>

      {user && (
        <div className="flex items-center gap-4">
          {user.photoURL && (
            <Image
              src={user.photoURL}
              alt={user.displayName ?? "avatar"}
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            {user.displayName}
          </span>
          <button
            onClick={logout}
            className="text-sm px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80 cursor-pointer"
            style={{ background: "var(--border)", color: "var(--text)" }}
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
