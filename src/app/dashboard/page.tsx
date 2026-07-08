"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { subscribeLists, createList, updateList } from "@/lib/lists";
import { useToast } from "@/context/ToastContext";
import type { StashList } from "@/types";
import DashboardFooter from "@/components/DashboardFooter";
import CoverPickerModal from "@/components/CoverPickerModal";
import { getCoverById, DEFAULT_COVER } from "@/lib/stash-covers";

// Deterministic accent color per stash based on name
const ACCENT_BORDERS = [
  "border-violet-500/30",
  "border-indigo-500/30",
  "border-fuchsia-500/30",
  "border-sky-500/30",
  "border-teal-500/30",
  "border-rose-500/30",
  "border-amber-500/30",
];

const ACCENT_DOTS = [
  "bg-violet-500",
  "bg-indigo-500",
  "bg-fuchsia-500",
  "bg-sky-500",
  "bg-teal-500",
  "bg-rose-500",
  "bg-amber-500",
];

function accentIndex(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return hash % ACCENT_BORDERS.length;
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [lists, setLists] = useState<StashList[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeLists(user.uid, setLists);
  }, [user]);

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  async function handleCreate() {
    const name = newName.trim();
    if (!name || !user) return;
    setCreating(false);
    setNewName("");
    await createList(user.uid, name);
    showToast(`"${name}" created`);
  }

  const firstName = user?.displayName?.split(" ")[0] ?? "there";

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <div className="px-8 pt-10 pb-8 max-w-5xl mx-auto w-full flex-1">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Hey, {firstName} 👋
            </h1>
            <p className="text-sm text-muted mt-1">
              {lists.length === 0
                ? "Create your first stash to get started."
                : `You have ${lists.length} stash${lists.length !== 1 ? "es" : ""}.`}
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors cursor-pointer shrink-0"
          >
            <span className="text-base leading-none">+</span>
            New stash
          </button>
        </div>

        {/* ── Create input ── */}
        {creating && (
          <div className="mb-8 p-4 rounded-xl border border-violet-500 bg-surface flex items-center gap-3">
            <input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") { setCreating(false); setNewName(""); }
              }}
              placeholder="Give your stash a name…"
              className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-medium cursor-pointer"
            >
              Create
            </button>
            <button
              onClick={() => { setCreating(false); setNewName(""); }}
              className="text-muted hover:text-foreground text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Grid or empty state ── */}
        {lists.length === 0 && !creating ? (
          <EmptyState onNew={() => setCreating(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {lists.map((list) => (
              <ListCard key={list.id} list={list} />
            ))}
            {/* "New stash" ghost card */}
            <button
              onClick={() => setCreating(true)}
              className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border hover:border-violet-500/50 bg-transparent hover:bg-violet-600/5 transition-all cursor-pointer min-h-[172px] text-muted hover:text-violet-400"
            >
              <span className="text-2xl opacity-40 group-hover:opacity-100 transition-opacity">+</span>
              <span className="text-xs font-medium">New stash</span>
            </button>
          </div>
        )}
      </div>
      <DashboardFooter />
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-5">
      <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-3xl">
        ◈
      </div>
      <div>
        <p className="text-foreground font-medium mb-1">No stashes yet</p>
        <p className="text-muted text-sm max-w-xs">
          Create your first stash to start saving products, links, and wishlist items — all in one place.
        </p>
      </div>
      <button
        onClick={onNew}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors cursor-pointer"
      >
        <span className="text-base leading-none">+</span>
        Create your first stash
      </button>
    </div>
  );
}

function ListCard({ list }: { list: StashList }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const idx = accentIndex(list.name);
  const cover = getCoverById(list.cover || DEFAULT_COVER);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    const url = `${window.location.origin}/s/${list.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleCoverClick(e: React.MouseEvent) {
    e.stopPropagation();
    setShowCoverPicker(true);
  }

  async function handleCoverSave(coverId: string) {
    await updateList(list.id, { cover: coverId });
    setShowCoverPicker(false);
  }

  return (
    <>
      <div
        className={`group relative flex flex-col rounded-xl border ${ACCENT_BORDERS[idx]} bg-surface hover:bg-surface-2 transition-all cursor-pointer overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5`}
        onClick={() => router.push(`/dashboard/list/${list.id}`)}
      >
        {/* ── Cover illustration ── */}
        <div className="relative h-28 w-full overflow-hidden bg-surface-2 shrink-0">
          {/* Radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.1)_0%,transparent_70%)]" />
          {/* Illustration */}
          <div className={`absolute inset-0 p-5 text-violet-400 transition-opacity`}>
            {cover.svg}
          </div>
          {/* Gradient overlay at bottom to blend into card body */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-surface-2 to-transparent" />
          {/* Change cover button — shows on hover */}
          <button
            onClick={handleCoverClick}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded-md bg-black/50 border border-white/10 text-[10px] text-white/70 hover:text-white hover:bg-black/70 cursor-pointer backdrop-blur-sm"
          >
            Change cover
          </button>
        </div>

        {/* ── Card body ── */}
        <div className="flex flex-col gap-2 px-4 pt-3 pb-3 flex-1">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2 h-2 rounded-full shrink-0 ${ACCENT_DOTS[idx]}`} />
              <h3 className="font-semibold text-foreground text-sm truncate">{list.name}</h3>
            </div>
            <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${
              list.isPublic
                ? "bg-violet-600/15 text-violet-400 border border-violet-500/20"
                : "bg-surface-2 text-muted border border-border"
            }`}>
              {list.isPublic ? "Public" : "Private"}
            </span>
          </div>

          {/* Description */}
          {list.description ? (
            <p className="text-xs text-muted line-clamp-2 leading-relaxed">{list.description}</p>
          ) : (
            <p className="text-xs text-muted/30 italic">No description</p>
          )}

          {/* Tag pills preview */}
          {list.tagOrder.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {list.tagOrder.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px] bg-violet-600/10 text-violet-400 border border-violet-500/15"
                >
                  {tag}
                </span>
              ))}
              {list.tagOrder.length > 3 && (
                <span className="text-[10px] text-muted">+{list.tagOrder.length - 3} more</span>
              )}
            </div>
          )}
        </div>

        {/* ── Card footer ── */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-[11px] text-muted">
            <span className="flex items-center gap-1">
              <span className="opacity-50">⊞</span>
              {list.itemCount} item{list.itemCount !== 1 ? "s" : ""}
            </span>
            <span className="opacity-40">·</span>
            <span className="opacity-60">{timeAgo(list.updatedAt)}</span>
          </div>

          {list.isPublic ? (
            <button
              onClick={handleCopy}
              title="Copy share link"
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-600/10 border border-violet-500/20 text-violet-400 hover:bg-violet-600/20 transition-colors text-[11px] cursor-pointer opacity-0 group-hover:opacity-100"
            >
              {copied ? "✓ Copied" : "⎘ Share"}
            </button>
          ) : (
            <span className="text-[11px] text-muted/30 opacity-0 group-hover:opacity-100 transition-opacity">
              Open →
            </span>
          )}
        </div>
      </div>

      {showCoverPicker && (
        <CoverPickerModal
          current={list.cover || DEFAULT_COVER}
          onSave={handleCoverSave}
          onClose={() => setShowCoverPicker(false)}
        />
      )}
    </>
  );
}
