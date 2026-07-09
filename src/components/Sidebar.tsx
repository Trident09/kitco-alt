"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "⊞", label: "My Stashes" },
];

const EXPLORE_ITEMS = [
  { href: "/", icon: "◈", label: "Home" },
  { href: "/about", icon: "⊹", label: "About" },
];

// Expose a context so DashboardLayout can render the hamburger in the right place
import { createContext, useContext } from "react";
export const SidebarContext = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
}>({ open: false, setOpen: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { open, setOpen } = useSidebar();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  // Prevent scroll on body when sidebar is open (mobile)
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname.startsWith("/dashboard");
    if (href === "/") return pathname === "/";
    return pathname === href;
  }

  const sidebarContent = (
    <aside className="w-56 shrink-0 h-full flex flex-col border-r border-border bg-surface px-4 py-6">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 mb-8 px-1 group">
        <Image
          src="/LOGO.svg"
          alt="Stashly"
          width={26}
          height={26}
          className="invert opacity-80 group-hover:opacity-100 transition-opacity"
        />
        <span className="text-base font-semibold tracking-tight text-foreground">Stashly</span>
      </Link>

      {/* Main nav */}
      <nav className="flex-1 flex flex-col gap-5 text-sm overflow-y-auto">
        {/* App section */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted/50 px-3 mb-1.5">
            App
          </p>
          <div className="space-y-0.5">
            {NAV_ITEMS.map(({ href, icon, label }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                  isActive(href)
                    ? "bg-violet-600/15 text-violet-300 font-medium"
                    : "text-muted hover:text-foreground hover:bg-surface-2"
                }`}
              >
                <span className={isActive(href) ? "text-violet-400" : "opacity-60"}>{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Explore section */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted/50 px-3 mb-1.5">
            Explore
          </p>
          <div className="space-y-0.5">
            {EXPLORE_ITEMS.map(({ href, icon, label }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                  isActive(href)
                    ? "bg-violet-600/15 text-violet-300 font-medium"
                    : "text-muted hover:text-foreground hover:bg-surface-2"
                }`}
              >
                <span className={isActive(href) ? "text-violet-400" : "opacity-60"}>{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-border pt-4 mt-4 shrink-0">
        <div className="flex items-center gap-3 px-1 mb-3">
          {user?.photoURL ? (
            <Image
              src={user.photoURL}
              alt="avatar"
              width={28}
              height={28}
              className="rounded-full ring-1 ring-border"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-xs text-white font-medium shrink-0">
              {user?.displayName?.[0] ?? "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs text-foreground font-medium truncate">
              {user?.displayName?.split(" ")[0]}
            </p>
            <p className="text-[10px] text-muted truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut(auth)}
          className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-muted hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer flex items-center gap-2"
        >
          <span className="opacity-50">↩</span>
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <div className="hidden md:flex h-screen sticky top-0">
        {sidebarContent}
      </div>

      {/* Mobile backdrop overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer — slides in from left */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
}
