"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPublicList, getPublicItems } from "@/lib/public";
import type { StashList, StashItem } from "@/types";

/* ─── helpers ─────────────────────────────────────────────── */

function parsePrice(price: string): number {
  const cleaned = price.replace(/[^0-9.,]/g, "").replace(",", "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function fmt(total: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(total);
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const d = Math.floor(diff / 86_400_000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d} days ago`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m} month${m > 1 ? "s" : ""} ago`;
  const y = Math.floor(m / 12);
  return `${y} year${y > 1 ? "s" : ""} ago`;
}

/* ─── page ────────────────────────────────────────────────── */

export default function SharePage() {
  const { listId } = useParams<{ listId: string }>();
  const [list, setList] = useState<StashList | null | "not-found">(null);
  const [items, setItems] = useState<StashItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    getPublicList(listId).then((l) => {
      if (!l) { setList("not-found"); return; }
      setList(l);
      getPublicItems(listId).then(setItems).catch((err) => {
        console.error("[public] getPublicItems error:", err?.code, err?.message);
      });
    }).catch((err) => {
      console.error("[public] getPublicList error:", err?.code, err?.message);
      setList("not-found");
    });
  }, [listId]);

  /* ── loading ── */
  if (list === null) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
        <p className="text-muted text-sm">Loading stash…</p>
      </div>
    </div>
  );

  /* ── not found ── */
  if (list === "not-found") return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center text-3xl border border-border">
        ◈
      </div>
      <p className="text-foreground font-semibold text-lg">Stash not found</p>
      <p className="text-muted text-sm">This stash doesn&apos;t exist or has been set to private.</p>
      <a href="/" className="mt-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
        Go to Stashly
      </a>
    </div>
  );

  /* ── stats ── */
  const totalItems = items.length;
  const purchasedItems = items.filter((i) => i.purchased);
  const unpurchasedItems = items.filter((i) => !i.purchased);
  const purchasedCount = purchasedItems.length;
  const progressPct = totalItems > 0 ? Math.round((purchasedCount / totalItems) * 100) : 0;

  const totalPrice = items.reduce((s, i) => s + parsePrice(i.price), 0);
  const purchasedPrice = purchasedItems.reduce((s, i) => s + parsePrice(i.price), 0);
  const remainingPrice = totalPrice - purchasedPrice;

  /* tag frequencies */
  const tagMap = new Map<string, number>();
  for (const item of items) {
    for (const t of item.tags) tagMap.set(t, (tagMap.get(t) ?? 0) + 1);
  }
  const tags = Array.from(tagMap.entries()).sort((a, b) => b[1] - a[1]);

  /* price buckets for each tag */
  const tagPriceMap = new Map<string, number>();
  for (const item of items) {
    const p = parsePrice(item.price);
    if (p > 0) {
      for (const t of item.tags) tagPriceMap.set(t, (tagPriceMap.get(t) ?? 0) + p);
    }
  }

  /* top item (highest price, unpurchased) */
  const topItem = unpurchasedItems
    .filter((i) => parsePrice(i.price) > 0)
    .sort((a, b) => parsePrice(b.price) - parsePrice(a.price))[0] ?? null;

  /* filtered items */
  const filtered = activeTag
    ? items.filter((i) => i.tags.includes(activeTag))
    : items;

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── nav ── */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-violet-900/30">
              S
            </div>
            <span className="text-sm font-semibold text-foreground group-hover:text-violet-400 transition-colors">
              Stashly
            </span>
          </a>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs text-muted hidden sm:block">
              {totalItems} item{totalItems !== 1 ? "s" : ""}
              {totalPrice > 0 && <> · <span className="text-foreground font-medium">{fmt(totalPrice)}</span></>}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600/10 border border-violet-500/20 text-violet-400 hover:bg-violet-600/20 transition-colors cursor-pointer"
            >
              {copied ? "✓ Copied!" : "⎘ Share"}
            </button>
          </div>
        </div>
      </header>

      {/* ── hero ── */}
      <div className="border-b border-border bg-surface/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight">{list.name}</h1>
          {list.description && (
            <p className="text-muted mt-2 max-w-xl text-sm sm:text-base">{list.description}</p>
          )}
          <p className="text-xs text-muted mt-3">
            Updated {timeAgo(list.updatedAt)}
          </p>

          {/* Progress bar */}
          {totalItems > 0 && (
            <div className="mt-5 max-w-sm">
              <div className="flex items-center justify-between text-xs text-muted mb-1.5">
                <span>{purchasedCount} of {totalItems} purchased</span>
                <span className="font-medium text-foreground">{progressPct}%</span>
              </div>
              <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── layout: stacks on mobile, side-by-side on lg ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── LEFT / TOP: items ── */}
          <main className="flex-1 min-w-0 w-full">
            {/* Tag filter pills */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setActiveTag(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    activeTag === null
                      ? "bg-violet-600 border-violet-600 text-white"
                      : "bg-violet-600/10 border-violet-500/20 text-violet-400 hover:bg-violet-600/20"
                  }`}
                >
                  All {totalItems}
                </button>
                {tags.map(([tag, count]) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                      activeTag === tag
                        ? "bg-violet-600 border-violet-600 text-white"
                        : "bg-violet-600/10 border-violet-500/20 text-violet-400 hover:bg-violet-600/20"
                    }`}
                  >
                    {tag}
                    <span className="ml-1 opacity-60">{count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Item cards */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <div className="text-5xl opacity-20 mb-4">◈</div>
                <p className="text-muted">No items in this stash yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((item, idx) => (
                  <ShareItem key={item.id} item={item} index={idx} />
                ))}
              </div>
            )}
          </main>

          {/* ── RIGHT / BOTTOM: sidebar ── */}
          <aside className="w-full lg:w-72 lg:shrink-0 lg:sticky lg:top-24 flex flex-col gap-4">

            {/* Stats card */}
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Overview</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatTile label="Items" value={String(totalItems)} />
                <StatTile label="Purchased" value={String(purchasedCount)} accent />
                {totalPrice > 0 && (
                  <>
                    <StatTile label="Total value" value={fmt(totalPrice)} wide />
                    {remainingPrice > 0 && <StatTile label="Still needed" value={fmt(remainingPrice)} wide />}
                  </>
                )}
              </div>

              {/* Donut-ish progress ring */}
              {totalItems > 0 && (
                <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                  <ProgressRing pct={progressPct} size={52} />
                  <div className="text-xs text-muted leading-relaxed">
                    <span className="text-foreground font-semibold text-sm">{progressPct}%</span> done
                    <br />
                    {purchasedCount} of {totalItems} items
                  </div>
                </div>
              )}
            </div>

            {/* Top pick highlight */}
            {topItem && (
              <div className="rounded-2xl border border-violet-500/20 bg-violet-600/5 p-5">
                <h3 className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-3">
                  ★ Top Pick
                </h3>
                <div className="flex gap-3 items-start">
                  {topItem.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={topItem.image}
                      alt={topItem.name}
                      className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-muted text-lg shrink-0">
                      ◈
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{topItem.name}</p>
                    <p className="text-violet-400 font-bold text-base mt-0.5">{topItem.price}</p>
                    {topItem.url && (
                      <a
                        href={topItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        View ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Price by tag breakdown */}
            {tagPriceMap.size > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-5">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
                  Spend by Category
                </h3>
                <div className="space-y-2.5">
                  {Array.from(tagPriceMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([tag, price]) => {
                      const barPct = totalPrice > 0 ? (price / totalPrice) * 100 : 0;
                      return (
                        <div key={tag}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted truncate">{tag}</span>
                            <span className="text-foreground font-medium ml-2 shrink-0">{fmt(price)}</span>
                          </div>
                          <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-violet-500 rounded-full"
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Tag cloud */}
            {tags.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-5">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(([tag, count]) => (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                        activeTag === tag
                          ? "bg-violet-600 border-violet-600 text-white"
                          : "bg-violet-600/10 border-violet-500/20 text-violet-400 hover:bg-violet-600/20"
                      }`}
                    >
                      {tag}
                      <span className="ml-1 opacity-50">{count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="rounded-2xl border border-border bg-surface p-5 text-center">
              <p className="text-xs text-muted leading-relaxed mb-3">
                Want to make your own wishlist?
              </p>
              <a
                href="/"
                className="block w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
              >
                Try Stashly free →
              </a>
            </div>
          </aside>
        </div>
      </div>

      {/* ── footer ── */}
      <footer className="border-t border-border mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between text-xs text-muted">
          <a href="/" className="hover:text-violet-400 transition-colors">
            Made with <span className="text-violet-400 font-medium">Stashly</span>
          </a>
          <button
            onClick={handleCopy}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            {copied ? "✓ Link copied" : "Copy share link"}
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ─── sub-components ─────────────────────────────────────── */

function StatTile({ label, value, accent, wide }: {
  label: string;
  value: string;
  accent?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={`rounded-xl bg-surface-2 px-3 py-2.5 ${wide ? "col-span-2" : ""}`}>
      <p className="text-[10px] text-muted uppercase tracking-wider">{label}</p>
      <p className={`text-base font-bold mt-0.5 truncate ${accent ? "text-green-400" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function ProgressRing({ pct, size }: { pct: number; size: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2a2a3a" strokeWidth={6} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#7c3aed"
        strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShareItem({ item, index }: { item: StashItem; index: number }) {
  const price = parsePrice(item.price);

  return (
    <div
      className={`group relative flex gap-4 p-4 rounded-2xl border transition-all duration-200 ${
        item.purchased
          ? "border-border bg-surface opacity-60"
          : "border-border bg-surface hover:border-violet-500/40 hover:bg-surface/80 hover:shadow-lg hover:shadow-violet-900/10"
      }`}
    >
      {/* Index badge */}
      <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-surface border border-border text-[10px] text-muted flex items-center justify-center font-mono">
        {index + 1}
      </div>

      {/* Image */}
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image}
          alt={item.name}
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-border shrink-0 transition-all ${
            item.purchased ? "grayscale" : "group-hover:scale-[1.03]"
          }`}
        />
      ) : (
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-border bg-surface-2 flex items-center justify-center text-muted text-2xl shrink-0">
          ◈
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              className={`font-semibold text-sm leading-snug ${
                item.purchased ? "line-through text-muted" : "text-foreground"
              }`}
            >
              {item.name}
            </h3>
            {item.description && (
              <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
            )}
          </div>

          {/* Price + status */}
          <div className="shrink-0 text-right">
            {item.price && (
              <span
                className={`text-sm font-bold block ${
                  item.purchased ? "line-through text-muted" : "text-violet-400"
                }`}
              >
                {item.price}
              </span>
            )}
            {item.purchased && (
              <span className="text-xs text-green-400 font-medium flex items-center gap-1 mt-0.5">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500/20 text-green-400 text-[9px] flex items-center justify-center">✓</span>
                Purchased
              </span>
            )}
            {!item.purchased && price > 0 && (
              <span className="text-[10px] text-muted mt-0.5 block">
                {price < 50 ? "Budget pick" : price < 200 ? "Mid-range" : "Premium"}
              </span>
            )}
          </div>
        </div>

        {/* Notes */}
        {item.notes && (
          <p className="text-xs text-muted/70 mt-1.5 italic bg-surface-2 rounded-lg px-2.5 py-1.5 border border-border line-clamp-2">
            &ldquo;{item.notes}&rdquo;
          </p>
        )}

        {/* Tags + link row */}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          {item.tags.map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded-full bg-violet-600/10 text-violet-400 text-[11px] border border-violet-500/15"
            >
              {t}
            </span>
          ))}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors group/link"
            >
              <span className="group-hover/link:underline">View product</span>
              <span className="text-[10px]">↗</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
