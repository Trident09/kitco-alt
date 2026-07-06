"use client";

import { useEffect, useRef, useState } from "react";
import type { StashItem } from "@/types";

/* ─── types ────────────────────────────────────────────────── */

interface SearchResult {
  title: string;
  url: string;
  displayUrl: string;
  snippet: string;
}

type ScrapedData = Pick<StashItem, "name" | "image" | "price" | "description">;

type AddState = "idle" | "scraping" | "done" | "error";

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
  const [searchError, setSearchError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null); // url of item being added

  // per-result state: scraped data + tag selection
  const [scraped, setScraped] = useState<Record<string, ScrapedData>>({});
  const [addState, setAddState] = useState<Record<string, AddState>>({});
  const [tagSelections, setTagSelections] = useState<Record<string, string[]>>({});
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
  const [showTagFor, setShowTagFor] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* ── search ── */
  async function runSearch(q: string) {
    if (!q.trim()) { setResults([]); setSearched(false); setSearchError(null); return; }
    setSearching(true);
    setSearched(false);
    setSearchError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (data.error) {
        setSearchError(data.error);
        setResults([]);
      } else {
        setResults(data.results ?? []);
      }
    } catch {
      setSearchError("Search failed — check your connection.");
      setResults([]);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  }

  function handleQueryChange(v: string) {
    setQuery(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runSearch(v), 600);
  }

  function handleQueryKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (debounce.current) clearTimeout(debounce.current);
      runSearch(query);
    }
  }

  /* ── scrape & add ── */
  async function handleAdd(result: SearchResult) {
    if (addState[result.url] === "done") return;
    setAddingId(result.url);
    setAddState((s) => ({ ...s, [result.url]: "scraping" }));

    let data: ScrapedData = { name: result.title, image: "", price: "", description: result.snippet };

    try {
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(result.url)}`);
      const json = await res.json();
      data = {
        name: json.name || result.title,
        image: json.image || "",
        price: json.price || "",
        description: json.description || result.snippet,
      };
    } catch { /* use fallback data */ }

    setScraped((s) => ({ ...s, [result.url]: data }));
    setAddState((s) => ({ ...s, [result.url]: "idle" }));
    setTagSelections((s) => ({ ...s, [result.url]: [] }));
    setTagInputs((s) => ({ ...s, [result.url]: "" }));
    setShowTagFor(result.url);
  }

  async function handleConfirmAdd(result: SearchResult) {
    const data = scraped[result.url];
    if (!data) return;
    setAddState((s) => ({ ...s, [result.url]: "scraping" }));
    try {
      await onAdd({
        name: data.name,
        url: result.url,
        image: data.image,
        price: data.price,
        description: data.description,
        notes: "",
        tags: tagSelections[result.url] ?? [],
      });
      setAddState((s) => ({ ...s, [result.url]: "done" }));
      setShowTagFor(null);
      setAddingId(null);
    } catch {
      setAddState((s) => ({ ...s, [result.url]: "error" }));
    }
  }

  function addTagToResult(url: string, tag: string) {
    const t = tag.trim().toLowerCase();
    if (!t) return;
    setTagSelections((s) => ({
      ...s,
      [url]: s[url]?.includes(t) ? s[url] : [...(s[url] ?? []), t],
    }));
    setTagInputs((s) => ({ ...s, [url]: "" }));
  }

  function removeTagFromResult(url: string, tag: string) {
    setTagSelections((s) => ({ ...s, [url]: (s[url] ?? []).filter((t) => t !== tag) }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm pt-16 px-4 pb-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl flex flex-col max-h-[80vh] shadow-2xl">

        {/* ── Search bar ── */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <span className="text-muted text-lg shrink-0">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleQueryKeyDown}
            placeholder="Search for a product (e.g. Sony WH-1000XM5, boAt headphones…)"
            className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted"
          />
          {searching && (
            <span className="text-xs text-violet-400 animate-pulse shrink-0">Searching…</span>
          )}
          <button onClick={onClose} className="text-muted hover:text-foreground cursor-pointer text-lg shrink-0">✕</button>
        </div>

        {/* ── Results ── */}
        <div className="flex-1 overflow-y-auto">
          {!searched && !searching && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8">
              <div className="text-4xl mb-3 opacity-30">🛍️</div>
              <p className="text-muted text-sm">Type a product name to search the web</p>
              <p className="text-muted/60 text-xs mt-1">Results from Brave Search · click any to add to your stash</p>
            </div>
          )}

          {searched && searchError && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8 gap-3">
              <div className="text-3xl opacity-40">⚠️</div>
              <p className="text-foreground text-sm font-medium">Search unavailable</p>
              <p className="text-muted text-xs max-w-sm leading-relaxed">{searchError}</p>
              {searchError.includes("BRAVE_SEARCH_API_KEY") && (
                <a
                  href="https://brave.com/search/api/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 px-3 py-1.5 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 text-xs hover:bg-violet-600/20 transition-colors"
                >
                  Get a free Brave Search API key →
                </a>
              )}
            </div>
          )}

          {searched && !searchError && results.length === 0 && !searching && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8">
              <div className="text-3xl mb-3 opacity-30">◈</div>
              <p className="text-muted text-sm">No results found</p>
              <p className="text-muted/60 text-xs mt-1">Try different keywords</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="divide-y divide-border">
              {results.map((result) => {
                const state = addState[result.url] ?? "idle";
                const isDone = state === "done";
                const isScraping = state === "scraping";
                const isShowingTags = showTagFor === result.url && scraped[result.url] && !isDone;
                const scrapedInfo = scraped[result.url];

                return (
                  <div key={result.url} className={`p-4 transition-colors ${isDone ? "opacity-50" : "hover:bg-surface-2"}`}>

                    {/* Result row */}
                    <div className="flex items-start gap-3">
                      {/* Favicon */}
                      <div className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center shrink-0 overflow-hidden mt-0.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${result.displayUrl}&sz=32`}
                          alt=""
                          className="w-4 h-4"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-violet-400 truncate">{result.displayUrl}</p>
                        <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 mt-0.5">
                          {result.title}
                        </p>
                        {result.snippet && (
                          <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">{result.snippet}</p>
                        )}
                      </div>

                      {/* Add button */}
                      <div className="shrink-0 ml-2">
                        {isDone ? (
                          <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                            <span>✓</span> Added
                          </span>
                        ) : isScraping && !isShowingTags ? (
                          <span className="text-xs text-violet-400 animate-pulse">Fetching…</span>
                        ) : isShowingTags ? null : (
                          <button
                            onClick={() => handleAdd(result)}
                            disabled={!!addingId && addingId !== result.url}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 hover:bg-violet-600/20 text-xs font-medium transition-colors cursor-pointer disabled:opacity-40"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ── Scraped preview + tag picker (expands after clicking Add) ── */}
                    {isShowingTags && scrapedInfo && (
                      <div className="mt-3 ml-11 pl-0">
                        {/* Scraped preview */}
                        <div className="flex gap-3 p-3 rounded-xl bg-surface border border-border mb-3">
                          {scrapedInfo.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={scrapedInfo.image}
                              alt={scrapedInfo.name}
                              className="w-14 h-14 rounded-lg object-cover border border-border shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-muted text-xl shrink-0">◈</div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-1">{scrapedInfo.name}</p>
                            {scrapedInfo.price && (
                              <p className="text-violet-400 font-bold text-sm mt-0.5">{scrapedInfo.price}</p>
                            )}
                            {scrapedInfo.description && (
                              <p className="text-xs text-muted mt-1 line-clamp-2">{scrapedInfo.description}</p>
                            )}
                          </div>
                        </div>

                        {/* Tag picker */}
                        <div className="space-y-2 mb-3">
                          <p className="text-xs text-muted">Add tags <span className="opacity-50">(optional)</span></p>

                          {/* Selected tags */}
                          {(tagSelections[result.url] ?? []).length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {(tagSelections[result.url] ?? []).map((t) => (
                                <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-400 text-xs">
                                  {t}
                                  <button type="button" onClick={() => removeTagFromResult(result.url, t)}
                                    className="cursor-pointer hover:text-white ml-0.5">✕</button>
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <input
                              value={tagInputs[result.url] ?? ""}
                              onChange={(e) => setTagInputs((s) => ({ ...s, [result.url]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); addTagToResult(result.url, tagInputs[result.url] ?? ""); }
                                if (e.key === ",") { e.preventDefault(); addTagToResult(result.url, tagInputs[result.url] ?? ""); }
                              }}
                              placeholder="Type tag and press Enter…"
                              className="input text-xs py-1.5 flex-1"
                            />
                          </div>

                          {/* Existing tag suggestions */}
                          {existingTags.filter((t) => !(tagSelections[result.url] ?? []).includes(t)).length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {existingTags
                                .filter((t) => !(tagSelections[result.url] ?? []).includes(t))
                                .map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => addTagToResult(result.url, t)}
                                    className="px-2 py-0.5 rounded-full text-xs bg-surface-2 border border-border text-muted hover:text-violet-400 hover:border-violet-500/30 transition-colors cursor-pointer"
                                  >
                                    + {t}
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>

                        {/* Confirm / cancel */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setShowTagFor(null); setAddingId(null); setAddState((s) => ({ ...s, [result.url]: "idle" })); }}
                            className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-foreground cursor-pointer transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleConfirmAdd(result)}
                            disabled={isScraping}
                            className="flex-1 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-medium transition-colors cursor-pointer"
                          >
                            {isScraping ? "Adding…" : "Add to stash"}
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
          <span>Results from Brave Search</span>
          <span>Press <kbd className="px-1 py-0.5 rounded bg-surface-2 border border-border font-mono text-[10px]">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
