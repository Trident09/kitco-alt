import Link from "next/link";
import Image from "next/image";

export default function DashboardFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border mt-12">
      <div className="max-w-4xl mx-auto px-8 py-8">

        {/* Main row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

          {/* Logo + tagline */}
          <div className="flex flex-col gap-1">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <Image
                src="/LOGO.svg"
                alt="Stashly"
                width={22}
                height={22}
                className="invert opacity-60 group-hover:opacity-100 transition-opacity"
              />
              <span className="text-sm font-semibold text-muted group-hover:text-foreground transition-colors">
                Stashly
              </span>
            </Link>
            <p className="text-xs text-muted/60">Your personal wishlist, organized.</p>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-5 text-xs text-muted">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              My Stashes
            </Link>
            <Link href="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <a
              href="https://rupam.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Portfolio ↗
            </a>
          </nav>

          {/* Right: copyright */}
          <p className="text-xs text-muted/60">
            © {year} Stashly. All rights reserved.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">

          {/* Keyboard hints */}
          <div className="flex items-center gap-3 text-[11px] text-muted/50 flex-wrap">
            <span className="uppercase tracking-wider font-medium text-muted/40">Shortcuts</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border font-mono text-[10px]">N</kbd>
              New item
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border font-mono text-[10px]">/</kbd>
              Search
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border font-mono text-[10px]">S</kbd>
              Settings
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border font-mono text-[10px]">Esc</kbd>
              Close / clear
            </span>
          </div>

          {/* Builder credit */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted/50">
            <span>Built by</span>
            <a
              href="https://rupam.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-muted hover:text-violet-400 transition-colors font-medium"
            >
              <span className="w-4 h-4 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-[9px] text-violet-400 font-bold">
                R
              </span>
              Rupam Barui
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
