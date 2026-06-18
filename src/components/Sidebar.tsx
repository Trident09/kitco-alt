"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 flex flex-col border-r border-border bg-surface px-4 py-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8 px-1">
        <div className="w-7 h-7 rounded-md bg-violet-600 flex items-center justify-center text-white font-bold text-xs select-none">
          S
        </div>
        <span className="text-base font-semibold tracking-tight text-foreground">Stashly</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 text-sm">
        <a
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-foreground bg-surface-2 font-medium"
        >
          <span className="text-violet-400">⊞</span>
          My Stashes
        </a>
      </nav>

      {/* User */}
      <div className="border-t border-border pt-4 mt-4">
        <div className="flex items-center gap-3 px-1 mb-3">
          {user?.photoURL ? (
            <Image
              src={user.photoURL}
              alt="avatar"
              width={28}
              height={28}
              className="rounded-full"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-xs text-white font-medium">
              {user?.displayName?.[0] ?? "?"}
            </div>
          )}
          <span className="text-sm text-foreground truncate flex-1">
            {user?.displayName?.split(" ")[0]}
          </span>
        </div>
        <button
          onClick={() => signOut(auth)}
          className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-muted hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
