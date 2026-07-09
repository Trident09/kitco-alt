"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar, { SidebarProvider, useSidebar } from "@/components/Sidebar";
import KeyboardShortcutsLegend from "@/components/KeyboardShortcutsLegend";
import Image from "next/image";
import Link from "next/link";

const SHORTCUTS = [
  { keys: ["N"],         label: "Add new item" },
  { keys: ["/"],         label: "Focus search" },
  { keys: ["S"],         label: "Open settings" },
  { keys: ["Backspace"], label: "Go back to dashboard" },
  { keys: ["Esc"],       label: "Close modal / clear search" },
];

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { setOpen } = useSidebar();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar — only visible on small screens */}
        <header className="md:hidden shrink-0 flex items-center gap-3 px-4 h-14 border-b border-border bg-surface">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 text-muted hover:text-foreground cursor-pointer"
          >
            <span className="w-5 h-px bg-current rounded-full" />
            <span className="w-5 h-px bg-current rounded-full" />
            <span className="w-5 h-px bg-current rounded-full" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/LOGO.svg"
              alt="Stashly"
              width={22}
              height={22}
              className="invert opacity-80"
            />
            <span className="text-sm font-semibold tracking-tight text-foreground">Stashly</span>
          </Link>
        </header>

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>

      {/* Keyboard shortcuts legend — hidden on mobile */}
      <div className="hidden md:block">
        <KeyboardShortcutsLegend shortcuts={SHORTCUTS} />
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </SidebarProvider>
  );
}
