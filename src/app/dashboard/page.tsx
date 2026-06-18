"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-foreground">My Stashes</h1>
          <button
            onClick={() => signOut(auth)}
            className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
        <p className="text-muted text-sm">Welcome, {user.displayName}. Your lists will appear here.</p>
      </div>
    </main>
  );
}
