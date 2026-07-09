"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { subscribeLists, updateList, deleteList } from "@/lib/lists";
import { useToast } from "@/context/ToastContext";
import type { StashList } from "@/types";
import ConfirmModal from "@/components/ConfirmModal";
import DashboardFooter from "@/components/DashboardFooter";

export default function StashSettingsPage() {
  const { listId } = useParams<{ listId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [list, setList] = useState<StashList | null>(null);

  // Rename state
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [renameSaved, setRenameSaved] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Delete modal
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!user) return;
    return subscribeLists(user.uid, (lists) => {
      const found = lists.find((l) => l.id === listId);
      if (found) {
        setList(found);
        setNewName((prev) => prev || found.name);
        setNewDesc((prev) => prev || found.description);
      }
    });
  }, [user, listId]);

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name || !list) return;
    await updateList(list.id, { name, description: newDesc.trim() });
    setRenameSaved(true);
    showToast("Settings saved");
    setTimeout(() => setRenameSaved(false), 2000);
  }

  async function handleToggleVisibility() {
    if (!list) return;
    const next = !list.isPublic;
    await updateList(list.id, { isPublic: next });
    showToast(next ? "Stash is now public" : "Stash is now private");
  }

  async function handleDelete() {
    if (!list) return;
    await deleteList(list.id);
    showToast(`"${list.name}" deleted`, "error");
    router.replace("/dashboard");
  }

  if (!list) return null;

  return (
    <div className="h-full overflow-y-auto flex flex-col">
    <div className="p-4 sm:p-6 md:p-8 max-w-xl mx-auto flex-1 w-full">
      {/* Back */}
      <button
        onClick={() => router.push(`/dashboard/list/${listId}`)}
        className="text-xs text-muted hover:text-foreground mb-6 flex items-center gap-1 cursor-pointer"
      >
        ← Back to stash
      </button>

      <h1 className="text-xl font-semibold text-foreground mb-8">Stash settings</h1>

      {/* Rename / edit section */}
      <section className="mb-8 p-5 rounded-xl border border-border bg-surface space-y-4">
        <h2 className="text-sm font-medium text-foreground">General</h2>
        <form onSubmit={handleRename} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted">Name</label>
            <input
              ref={nameRef}
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setRenameSaved(false); }}
              className="input"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted">Description</label>
            <textarea
              value={newDesc}
              onChange={(e) => { setNewDesc(e.target.value); setRenameSaved(false); }}
              rows={2}
              placeholder="What's this stash for?"
              className="input resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={!newName.trim() || (newName.trim() === list.name && newDesc.trim() === list.description)}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            {renameSaved ? "✓ Saved" : "Save changes"}
          </button>
        </form>
      </section>

      {/* Visibility section */}
      <section className="mb-8 p-5 rounded-xl border border-border bg-surface">
        <h2 className="text-sm font-medium text-foreground mb-1">Visibility</h2>
        <p className="text-xs text-muted mb-4">
          {list.isPublic
            ? "This stash is public. Anyone with the link can view it."
            : "This stash is private. Only you can see it."}
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleToggleVisibility}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${
              list.isPublic
                ? "border-border text-muted hover:text-foreground hover:bg-surface-2"
                : "border-violet-500/50 bg-violet-600/10 text-violet-400 hover:bg-violet-600/20"
            }`}
          >
            {list.isPublic ? "Make private" : "Make public"}
          </button>
          {list.isPublic && <CopyLink listId={list.id} />}
        </div>
      </section>

      {/* Danger zone */}
      <section className="p-5 rounded-xl border border-red-500/20 bg-red-500/5">
        <h2 className="text-sm font-medium text-red-400 mb-1">Danger zone</h2>
        <p className="text-xs text-muted mb-4">
          Permanently delete this stash and all its items. This cannot be undone.
        </p>
        <button
          onClick={() => setShowDelete(true)}
          className="px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-colors cursor-pointer"
        >
          Delete stash
        </button>
      </section>

      {showDelete && (
        <ConfirmModal
          title="Delete stash?"
          description={`"${list.name}" and all its items will be permanently removed.`}
          confirmLabel="delete"
          confirmPlaceholder="type delete to confirm"
          actionLabel="Delete stash"
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
        />
      )}
    </div>
    <DashboardFooter />
    </div>
  );
}

function CopyLink({ listId }: { listId: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/s/${listId}`;

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm text-muted hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
    >
      {copied ? "✓ Copied" : "Copy share link"}
    </button>
  );
}
