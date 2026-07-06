"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import KeyboardShortcutsLegend from "@/components/KeyboardShortcutsLegend";

const SHORTCUTS = [
  { keys: ["N"],         label: "Add new item" },
  { keys: ["F"],         label: "Search web for products" },
  { keys: ["/"],         label: "Focus search" },
  { keys: ["S"],         label: "Open settings" },
  { keys: ["Backspace"], label: "Go back to dashboard" },
  { keys: ["Esc"],       label: "Close modal / clear search" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <KeyboardShortcutsLegend shortcuts={SHORTCUTS} />
    </div>
  );
}
