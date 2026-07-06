"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { subscribeLists, createList } from "@/lib/lists";
import { useToast } from "@/context/ToastContext";
import type { StashList } from "@/types";

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

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Stashes</h1>
          <p className="text-sm text-muted mt-0.5">{lists.length} list{lists.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors cursor-pointer"
        >
          <span className="text-base leading-none">+</span>
          New stash
        </button>
      </div>

      {creating && (
        <div className="mb-6 p-4 rounded-xl border border-violet-500 bg-surface flex items-center gap-3">
          <input
            ref={inputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") { setCreating(false); setNewName(""); }
            }}
            placeholder="Stash name…"
            className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted"
          />
          <button onClick={handleCreate} disabled={!newName.trim()}
            className="px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-medium cursor-pointer">
            Create
          </button>
          <button onClick={() => { setCreating(false); setNewName(""); }}
            className="text-muted hover:text-foreground text-sm cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {lists.length === 0 && !creating ? (
        <EmptyState onNew={() => setCreating(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      )}
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

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    const url = `${window.location.origin}/s/${list.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="group relative flex flex-col gap-3 p-5 rounded-xl border border-border bg-surface hover:border-violet-500/50 transition-colors cursor-pointer"
      onClick={() => router.push(`/dashboard/list/${list.id}`)}
    >
      <h3 className="font-medium text-foreground text-base truncate">{list.name}</h3>
      {list.description && (
        <p className="text-xs text-muted line-clamp-2">{list.description}</p>
      )}
      <div className="flex items-center gap-2 text-xs text-muted mt-auto pt-2 border-t border-border">
        <span>{list.itemCount} item{list.itemCount !== 1 ? "s" : ""}</span>
        <span>·</span>
        <span className={list.isPublic ? "text-violet-400" : ""}>{list.isPublic ? "Public" : "Private"}</span>
        <span>·</span>
        <span>{new Date(list.createdAt).toLocaleDateString()}</span>

        {/* Copy link button for public stashes */}
        {list.isPublic && (
          <button
            onClick={handleCopy}
            title="Copy share link"
            className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-600/10 border border-violet-500/20 text-violet-400 hover:bg-violet-600/20 transition-colors text-xs cursor-pointer opacity-0 group-hover:opacity-100"
          >
            {copied ? "✓ Copied" : "⎘ Share"}
          </button>
        )}
      </div>
    </div>
  );
}
