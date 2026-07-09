import Link from "next/link";
import Footer from "@/components/Footer";
import BackToDashboard from "@/components/BackToDashboard";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-violet-600 flex items-center justify-center text-white font-bold text-xs select-none">
              S
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">Stashly</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors px-3 py-1.5">
              Home
            </Link>
            <BackToDashboard />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20 w-full">
        {/* Title */}
        <div className="mb-10 sm:mb-12">
          <p className="text-xs text-violet-400 font-medium mb-3 uppercase tracking-widest">About</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-4">
            Built for people who save too many tabs.
          </h1>
          <p className="text-muted text-base leading-relaxed">
            You know the drill — you find something you want to buy, open a tab, forget about it,
            and a week later you have 47 tabs open and can&apos;t remember why half of them exist.
            Stashly is the fix.
          </p>
        </div>

        {/* Story */}
        <div className="space-y-6 text-sm text-muted leading-relaxed mb-16">
          <p>
            Stashly is a personal product wishlist manager. You create stashes — named lists for
            any theme you want — and fill them with items. Paste a URL and we scrape the product
            details for you: name, image, price. Add your own notes. Tag things. Reorder them.
            Come back later when you&apos;re actually ready to buy.
          </p>
          <p>
            Everything is private by default. Your stashes belong to you. When you want to share
            one — a gift list for your birthday, a list of gear recommendations for a friend —
            flip it public and send the link. Simple.
          </p>
          <p>
            No ads. No tracking. No algorithm telling you what to buy. Just your lists.
          </p>
          <p>
            The honest origin story: I used to use{" "}
            <span className="text-foreground font-medium">kit.co</span> for exactly this.
            It was great — clean, simple, shareable lists of products you loved. Then it shut down.
            So I built my own.
          </p>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-sm font-semibold text-foreground mb-6">What we believe</h2>
          <div className="space-y-4">
            {values.map((v) => (
              <div key={v.title} className="flex gap-4 p-4 rounded-xl border border-border bg-surface">
                <span className="text-violet-400 text-lg shrink-0 mt-0.5">{v.icon}</span>
                <div>
                  <p className="text-sm font-medium text-foreground mb-0.5">{v.title}</p>
                  <p className="text-xs text-muted leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features summary */}
        <div className="mb-16">
          <h2 className="text-sm font-semibold text-foreground mb-6">What&apos;s inside</h2>
          <ul className="space-y-2.5">
            {featureList.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-muted">
                <span className="text-violet-400 text-xs">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="p-8 rounded-2xl border border-violet-500/20 bg-violet-600/5 text-center">
          <p className="text-foreground font-medium mb-1">Give it a try</p>
          <p className="text-sm text-muted mb-5">Free forever. Sign in with Google, no setup needed.</p>
          <Link
            href="/login"
            className="inline-flex px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            Create your first stash →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

const values = [
  {
    icon: "◎",
    title: "Privacy first",
    desc: "Your lists are private by default. We don't sell your data or show you ads.",
  },
  {
    icon: "⊹",
    title: "Simple over clever",
    desc: "No complexity for its own sake. Every feature earns its place.",
  },
  {
    icon: "⚡",
    title: "Fast and focused",
    desc: "Add an item in seconds. No friction, no onboarding flow, no bloat.",
  },
];

const featureList = [
  "Auto-fill product details from any URL",
  "Multiple stashes for different themes",
  "Tag items and filter by tag",
  "Drag and drop to reorder",
  "Mark items as purchased",
  "Make a stash public and share the link",
  "Search within a stash",
  "Works on any device",
];
