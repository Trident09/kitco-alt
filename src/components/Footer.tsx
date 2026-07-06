import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center sm:items-start gap-1">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/LOGO.svg" alt="Stashly" width={28} height={28} className="invert" />
              <span className="text-sm font-semibold text-foreground">Stashly</span>
            </Link>
            <p className="text-xs text-muted">Your personal wishlist, organized.</p>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6 text-xs text-muted">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-muted">© {new Date().getFullYear()} Stashly</p>
        </div>

        {/* Developer credit */}
        <div className="border-t border-border pt-6 flex items-center justify-center gap-2 text-xs text-muted">
          <span>Built by</span>
          <a
            href="https://rupam.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-foreground hover:text-violet-400 transition-colors font-medium"
          >
            <span className="w-5 h-5 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-[10px] text-violet-400 font-bold">R</span>
            Rupam Barui
            <span className="text-muted text-[10px]">↗</span>
          </a>
          <span>· designer & developer</span>
        </div>
      </div>
    </footer>
  );
}
