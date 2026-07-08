import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import BackToDashboard from "@/components/BackToDashboard";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/LOGO.svg" alt="Stashly" width={28} height={28} className="invert" />
            <span className="text-base font-semibold tracking-tight text-foreground">Stashly</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/about" className="text-sm text-muted hover:text-foreground transition-colors px-3 py-1.5">
              About
            </Link>
            <BackToDashboard />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-600/10 text-violet-400 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Free to use · No credit card needed
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-foreground leading-tight tracking-tight mb-6">
            Save what you want.<br />
            <span className="text-violet-400">Buy it when you&apos;re ready.</span>
          </h1>

          <p className="text-lg text-muted max-w-xl mx-auto mb-10 leading-relaxed">
            Stashly is your personal product wishlist. Paste a link, auto-fill the details, organize into lists, and share with anyone.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-colors shadow-lg shadow-violet-600/20"
            >
              Start for free →
            </Link>
            <Link
              href="/about"
              className="px-6 py-3 rounded-xl border border-border text-muted hover:text-foreground hover:border-violet-500/40 text-sm transition-colors"
            >
              Learn more
            </Link>
          </div>
        </section>

        {/* Feature grid */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-border bg-surface hover:border-violet-500/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-xl mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border bg-surface">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <h2 className="text-2xl font-bold text-foreground text-center mb-12">How it works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {steps.map((s, i) => (
                <div key={s.title} className="flex flex-col items-center text-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold text-sm">
                    {i + 1}
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">{s.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA banner */}
        <section className="max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="p-10 rounded-3xl border border-violet-500/20 bg-violet-600/5">
            <h2 className="text-3xl font-bold text-foreground mb-3">Ready to get organized?</h2>
            <p className="text-muted text-sm mb-8 max-w-md mx-auto">
              Join and start saving products you love. It&apos;s free, fast, and private by default.
            </p>
            <Link
              href="/login"
              className="inline-flex px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-colors shadow-lg shadow-violet-600/20"
            >
              Create your first stash →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

const features = [
  {
    icon: "⚡",
    title: "Auto-fill from any URL",
    desc: "Paste a product link and Stashly automatically grabs the name, image, and price for you.",
  },
  {
    icon: "◈",
    title: "Multiple stashes",
    desc: "Create separate lists for tech gear, travel, gifts, home finds — whatever you need.",
  },
  {
    icon: "✦",
    title: "Tag & filter",
    desc: "Add tags to items and filter by them instantly. Find exactly what you're looking for.",
  },
  {
    icon: "⠿",
    title: "Drag to reorder",
    desc: "Prioritize your wishlist by dragging items into the order that makes sense to you.",
  },
  {
    icon: "◎",
    title: "Private by default",
    desc: "Your stashes are yours alone. Make one public only when you want to share it.",
  },
  {
    icon: "✓",
    title: "Track purchases",
    desc: "Mark items as purchased and keep a record of what you've already bought.",
  },
];

const steps = [
  {
    title: "Create a stash",
    desc: "Give it a name — 'Birthday wishlist', 'Home office', anything you like.",
  },
  {
    title: "Add items",
    desc: "Paste a product URL and we'll fill in the details automatically. Add notes and tags.",
  },
  {
    title: "Share or keep private",
    desc: "Keep your stash private, or flip it public and share the link with friends and family.",
  },
];
