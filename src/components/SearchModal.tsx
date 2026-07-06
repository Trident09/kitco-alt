"use client";

import { useEffect, useRef, useState } from "react";
import type { StashItem } from "@/types";

/* ─── types ────────────────────────────────────────────────── */

interface SearchResult {
  title: string;
  url: string;
  displayUrl: string;
  snippet: string;
  image?: string;
  price?: string;
  brand?: string;
}

type AddState = "idle" | "scraping" | "confirming" | "saving" | "done" | "error";

interface Props {
  existingTags?: string[];
  onAdd: (data: {
    name: string;
    url: string;
    image: string;
    price: string;
    description: string;
    notes: string;
    tags: string[];
  }) => Promise<void>;
  onClose: () => void;
}

/* ═══════════════════════════════════════════════════════════ */

export default function SearchModal({ existingTags = [], onAdd, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  // per-result state
  const [addState, setAddState] = useState<Record<string, AddState>>({});
  const [tagSelections, setTagSelections] = useState<Record<string, string[]>>({});
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* ── detect if query is a URL ── */
  const isUrl = query.trim().startsWith("http://") || query.trim().startsWith("https://");

  /* ── search ── */
  async function runSearch(q: string) {
    if (!q.trim() || isUrl) return;
    setSearching(true);
    setSearched(false);
    setRateLimited(false);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (res.status === 429 || data.error === "too_fast") {
        setRateLimited(true);
        setResults([]);
      } else {
        setResults(data.results ?? []);
      }
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  }

  function handleQueryChange(v: string) {
    setQuery(v);
    if (isUrl) return; // don't auto-search URLs
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runSearch(v), 700);
  }

  function handleQueryKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isUrl) {
        handleScrapeUrl(query.trim());
      } else {
        if (debounce.current) clearTimeout(debounce.current);
        runSearch(query);
      }
    }
  }

  /* ── scrape a direct URL ── */
  async function handleScrapeUrl(url: string) {
    const key = url;
    setAddState((s) => ({ ...s, [key]: "scraping" }));
    setResults([]); // clear keyword results
    setSearched(true);

    let scraped: SearchResult = { title: url, url, displayUrl: new URL(url).hostname.replace(/^www\./, ""), snippet: "" };
    try {
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`);
      const d = await res.json();
      scraped = {
        title: d.name || url,
        url,
        displayUrl: new URL(url).hostname.replace(/^www\./, ""),
        snippet: d.description || "",
        image: d.image || "",
        price: d.price || "",
      };
    } catch { /* use fallback */ }

    setResults([scraped]);
    setAddState((s) => ({ ...s, [key]: "confirming" }));
    setTagSelections((s) => ({ ...s, [key]: [] }));
    setTagInputs((s) => ({ ...s, [key]: "" }));
    setExpandedUrl(key);
  }

  /* ── add flow ── */
  function handleClickAdd(result: SearchResult) {
    if (addState[result.url] === "done") return;
    setAddState((s) => ({ ...s, [result.url]: "confirming" }));
    setTagSelections((s) => ({ ...s, [result.url]: s[result.url] ?? [] }));
    setTagInputs((s) => ({ ...s, [result.url]: s[result.url + "_input"] ?? "" }));
    setExpandedUrl(result.url);
  }

  function handleCancelAdd(url: string) {
    setAddState((s) => ({ ...s, [url]: "idle" }));
    setExpandedUrl(null);
  }

  async function handleConfirmAdd(result: SearchResult) {
    setAddState((s) => ({ ...s, [result.url]: "saving" }));
    try {
      await onAdd({
        name: result.title,
        url: result.url,
        image: result.image ?? "",
        price: result.price ?? "",
        description: result.snippet,
        notes: "",
        tags: tagSelections[result.url] ?? [],
      });
      setAddState((s) => ({ ...s, [result.url]: "done" }));
      setExpandedUrl(null);
    } catch {
      setAddState((s) => ({ ...s, [result.url]: "error" }));
    }
  }

  function addTag(url: string, raw: string) {
    raw.split(",").map((s) => s.trim().toLowerCase()).filter((s) => s).forEach((t) => {
      setTagSelections((prev) => ({
        ...prev,
        [url]: prev[url]?.includes(t) ? prev[url] : [...(prev[url] ?? []), t],
      }));
    });
    setTagInputs((s) => ({ ...s, [url]: "" }));
  }

  function removeTag(url: string, tag: string) {
    setTagSelections((s) => ({ ...s, [url]: (s[url] ?? []).filter((t) => t !== tag) }));
  }

  /* ── render ── */
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm pt-16 px-4 pb-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl flex flex-col max-h-[80vh] shadow-2xl">

        {/* ── Input bar ── */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <span className="text-lg shrink-0">{isUrl ? "🔗" : "🔍"}</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleQueryKeyDown}
            placeholder="Search product name  or  paste a URL to add directly…"
            className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted"
          />
          {searching && <span className="text-xs text-violet-400 animate-pulse shrink-0">Searching…</span>}
          {isUrl && (
            <button
              onClick={() => handleScrapeUrl(query.trim())}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium cursor-pointer"
            >
              Fetch ↗
            </button>
          )}
          <button onClick={onClose} className="text-muted hover:text-foreground cursor-pointer text-lg shrink-0">✕</button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Empty / idle prompt */}
          {!searched && !searching && (
            <div className="flex flex-col items-center justify-center py-14 text-center px-8 gap-2">
              <div className="text-4xl opacity-25">🛍️</div>
              <p className="text-muted text-sm mt-2">Type a product name to search</p>
              <p className="text-muted/50 text-xs">or paste a product URL to add it directly</p>
            </div>
          )}

          {/* Rate limited */}
          {rateLimited && (
            <div className="flex flex-col items-center justify-center py-14 text-center px-8 gap-3">
              <div className="text-3xl opacity-40">⏳</div>
              <p className="text-foreground text-sm font-medium">Too many searches</p>
              <p className="text-muted text-xs max-w-xs">Please wait a moment and try again, or paste a direct product URL above.</p>
              <button
                onClick={() => { setRateLimited(false); runSearch(query); }}
                className="mt-1 px-3 py-1.5 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 text-xs hover:bg-violet-600/20 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* No results */}
          {searched && !rateLimited && results.length === 0 && !searching && (
            <div className="flex flex-col items-center justify-center py-14 text-center px-8">
              <div className="text-3xl mb-3 opacity-30">◈</div>
              <p className="text-muted text-sm">No products found for &ldquo;{query}&rdquo;</p>
              <p className="text-muted/50 text-xs mt-1">Try different keywords, or paste a direct product URL</p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="divide-y divide-border">
              {results.map((result) => {
                const state = addState[result.url] ?? "idle";
                const isExpanded = expandedUrl === result.url && state === "confirming";
                const isDone = state === "done";
                const isSaving = state === "saving";

                return (
                  <div key={result.url} className={`p-4 transition-colors ${isDone ? "opacity-40" : "hover:bg-surface-2/50"}`}>

                    {/* Result row */}
                    <div className="flex items-start gap-3">
                      {/* Image thumbnail */}
                      <div className="w-14 h-14 rounded-xl bg-surface-2 border border-border shrink-0 overflow-hidden flex items-center justify-center text-muted text-lg">
                        {result.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={result.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <span className="opacity-40">◈</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-violet-400 truncate">{result.displayUrl}{result.brand ? ` · ${result.brand}` : ""}</p>
                        <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 mt-0.5">{result.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {result.price && (
                            <span className="text-sm font-bold text-violet-400">{result.price}</span>
                          )}
                          {result.snippet && (
                            <span className="text-xs text-muted line-clamp-1 flex-1">{result.snippet}</span>
                          )}
                        </div>
                      </div>

                      {/* Action */}
                      <div className="shrink-0 ml-2 flex items-center">
                        {isDone ? (
                          <span className="text-xs text-green-400 font-medium">✓ Added</span>
                        ) : isSaving ? (
                          <span className="text-xs text-violet-400 animate-pulse">Saving…</span>
                        ) : state === "scraping" ? (
                          <span className="text-xs text-violet-400 animate-pulse">Fetching…</span>
                        ) : isExpanded ? null : (
                          <button
                            onClick={() => handleClickAdd(result)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 hover:bg-violet-600/20 text-xs font-medium transition-colors cursor-pointer"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ── Expanded tag picker ── */}
                    {isExpanded && (
                      <div className="mt-3 ml-[68px] space-y-2.5">

                        {/* Selected tags */}
                        {(tagSelections[result.url] ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {(tagSelections[result.url] ?? []).map((t) => (
                              <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-400 text-xs">
                                {t}
                                <button type="button" onClick={() => removeTag(result.url, t)} className="cursor-pointer hover:text-white ml-0.5">✕</button>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Tag input */}
                        <input
                          value={tagInputs[result.url] ?? ""}
                          onChange={(e) => setTagInputs((s) => ({ ...s, [result.url]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); addTag(result.url, tagInputs[result.url] ?? ""); }
                            if (e.key === ",") { e.preventDefault(); addTag(result.url, tagInputs[result.url] ?? ""); }
                          }}
                          placeholder="Add tags… (optional, Enter or comma)"
                          className="input text-xs py-1.5"
                          autoFocus
                        />

                        {/* Existing tag suggestions */}
                        {existingTags.filter((t) => !(tagSelections[result.url] ?? []).includes(t)).length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {existingTags
                              .filter((t) => !(tagSelections[result.url] ?? []).includes(t))
                              .map((t) => (
                                <button key={t} type="button" onClick={() => addTag(result.url, t)}
                                  className="px-2 py-0.5 rounded-full text-xs bg-surface-2 border border-border text-muted hover:text-violet-400 hover:border-violet-500/30 transition-colors cursor-pointer">
                                  + {t}
                                </button>
                              ))}
                          </div>
                        )}

                        {/* Confirm / cancel */}
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => handleCancelAdd(result.url)}
                            className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-foreground cursor-pointer transition-colors">
                            Cancel
                          </button>
                          <button onClick={() => handleConfirmAdd(result)}
                            className="flex-1 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors cursor-pointer">
                            Add to stash
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-4 py-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted">
          <span>Product data from UPC Item DB</span>
          <span>Press <kbd className="px-1 py-0.5 rounded bg-surface-2 border border-border font-mono text-[10px]">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
