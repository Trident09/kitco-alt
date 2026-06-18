"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPublicList, getPublicItems } from "@/lib/public";
import type { StashList, StashItem } from "@/types";

export default function SharePage() {
  const { listId } = useParams<{ listId: string }>();
  const [list, setList] = useState<StashList | null | "not-found">(null);
  const [items, setItems] = useState<StashItem[]>([]);

  useEffect(() => {
    getPublicList(listId).then((l) => {
      if (!l) { setList("not-found"); return; }
      setList(l);
      getPublicItems(listId).then(setItems);
    });
  }, [listId]);

  if (list === null) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted text-sm">Loading…</p>
    </div>
  );

  if (list === "not-found") return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
      <p className="text-foreground font-medium">This stash doesn't exist or is private.</p>
      <a href="/" className="text-sm text-violet-400 hover:underline">Go to Stashly</a>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center text-white text-xs font-bold">S</div>
            Stashly
          </a>
          <span className="text-xs text-muted">{items.length} item{items.length !== 1 ? "s" : ""}</span>
        </div>
      </header>

      {/* List info */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-semibold text-foreground">{list.name}</h1>
        {list.description && <p className="text-muted mt-2 text-sm">{list.description}</p>}

        {/* Items */}
        <div className="mt-8 space-y-3">
          {items.length === 0 ? (
            <p className="text-muted text-sm">No items in this stash yet.</p>
          ) : (
            items.map((item) => <ShareItem key={item.id} item={item} />)
          )}
        </div>
      </div>
    </div>
  );
}

function ShareItem({ item }: { item: StashItem }) {
  return (
    <div className="flex gap-4 p-4 rounded-xl border border-border bg-surface">
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover border border-border shrink-0" />
      ) : (
        <div className="w-20 h-20 rounded-lg border border-border bg-surface-2 flex items-center justify-center text-muted text-2xl shrink-0">◈</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-foreground text-sm">{item.name}</h3>
          {item.price && <span className="text-violet-400 text-sm font-semibold shrink-0">{item.price}</span>}
        </div>
        {item.description && <p className="text-xs text-muted mt-1 line-clamp-2">{item.description}</p>}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            View product ↗
          </a>
        )}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.map((t) => (
              <span key={t} className="px-1.5 py-0.5 rounded-full bg-violet-600/10 text-violet-400 text-xs">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
