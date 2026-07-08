"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  /** All tags currently in use on this stash's items */
  tags: string[];
  /** The user-defined order (subset; unlisted tags go at the end) */
  tagOrder: string[];
  onSave: (newOrder: string[], renames: Record<string, string>, deletions: string[]) => Promise<void>;
  onClose: () => void;
}

export default function ManageTagsModal({ tags, tagOrder, onSave, onClose }: Props) {
  // Merge tagOrder with any tags not yet in it (new tags go at end)
  const initialOrder = [
    ...tagOrder.filter((t) => tags.includes(t)),
    ...tags.filter((t) => !tagOrder.includes(t)),
  ];

  const [order, setOrder] = useState<string[]>(initialOrder);
  const [renames, setRenames] = useState<Record<string, string>>({}); // originalName → newName
  const [deletions, setDeletions] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = order.indexOf(active.id as string);
    const newIdx = order.indexOf(over.id as string);
    setOrder(arrayMove(order, oldIdx, newIdx));
  }

  function handleRename(original: string, value: string) {
    setRenames((r) => ({ ...r, [original]: value }));
  }

  function handleDelete(tag: string) {
    setDeletions((d) => { const n = new Set(d); n.add(tag); return n; });
  }

  function handleUndelete(tag: string) {
    setDeletions((d) => { const n = new Set(d); n.delete(tag); return n; });
  }

  async function handleSave() {
    // Validate: no two tags can rename to the same name
    const finalNames = order.map((t) => (renames[t]?.trim() || t));
    const unique = new Set(finalNames);
    if (unique.size !== finalNames.length) return; // duplicate — do nothing (UI shows it)

    setSaving(true);
    const cleanRenames: Record<string, string> = {};
    for (const [orig, val] of Object.entries(renames)) {
      const trimmed = val.trim();
      if (trimmed && trimmed !== orig) cleanRenames[orig] = trimmed;
    }
    await onSave(order, cleanRenames, Array.from(deletions));
    setSaving(false);
  }

  // Compute final names for duplicate detection
  const finalNames = order.map((t) => renames[t]?.trim() || t);
  const hasDuplicate = new Set(finalNames).size !== finalNames.length;
  const hasChanges =
    JSON.stringify(order) !== JSON.stringify(initialOrder) ||
    Object.values(renames).some((v) => v.trim()) ||
    deletions.size > 0;

  const visibleTags = order.filter((t) => !deletions.has(t));
  const deletedTags = order.filter((t) => deletions.has(t));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md flex flex-col max-h-[85vh] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Manage Tags</h2>
            <p className="text-xs text-muted mt-0.5">Drag to reorder · click to rename · delete removes from all items</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground cursor-pointer text-lg">✕</button>
        </div>

        {/* Tag list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {order.length === 0 && (
            <p className="text-muted text-sm text-center py-8">No tags yet.</p>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visibleTags} strategy={verticalListSortingStrategy}>
              {visibleTags.map((tag, idx) => {
                const currentName = renames[tag]?.trim() || tag;
                const isDuplicate = finalNames.filter((n) => n === currentName && !deletions.has(tag)).length > 1;
                return (
                  <SortableTagRow
                    key={tag}
                    tag={tag}
                    index={idx}
                    value={renames[tag] ?? tag}
                    isDuplicate={isDuplicate}
                    onChange={(v) => handleRename(tag, v)}
                    onDelete={() => handleDelete(tag)}
                  />
                );
              })}
            </SortableContext>
          </DndContext>

          {/* Deleted tags (shown as struck-out, with undo) */}
          {deletedTags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <p className="text-[11px] text-muted uppercase tracking-wider">Will be deleted</p>
              {deletedTags.map((tag) => (
                <div key={tag} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-red-500/5 border border-red-500/20">
                  <span className="text-xs text-muted/50 line-through flex-1">{renames[tag]?.trim() || tag}</span>
                  <button
                    onClick={() => handleUndelete(tag)}
                    className="text-xs text-violet-400 hover:text-violet-300 cursor-pointer shrink-0"
                  >
                    Undo
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border space-y-3">
          {hasDuplicate && (
            <p className="text-xs text-red-400">Two tags have the same name — rename one before saving.</p>
          )}
          {deletions.size > 0 && (
            <p className="text-xs text-amber-400">
              {deletions.size} tag{deletions.size > 1 ? "s" : ""} will be removed from all items permanently.
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges || hasDuplicate}
              className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sortable tag row ────────────────────────────────────── */

function SortableTagRow({
  tag, index, value, isDuplicate, onChange, onDelete,
}: {
  tag: string;
  index: number;
  value: string;
  isDuplicate: boolean;
  onChange: (v: string) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tag });
  const inputRef = useRef<HTMLInputElement>(null);
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-surface-2 transition-all ${
        isDragging
          ? "border-violet-500 opacity-80 shadow-lg z-10"
          : isDuplicate
            ? "border-red-500/40"
            : "border-border"
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-muted hover:text-foreground cursor-grab active:cursor-grabbing shrink-0 text-sm"
        aria-label="Drag to reorder"
      >
        ⠿
      </button>

      {/* Position badge */}
      <span className="text-[10px] text-muted/50 font-mono w-4 shrink-0 text-center">{index + 1}</span>

      {/* Tag pill preview */}
      <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />

      {/* Rename input */}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm text-foreground outline-none min-w-0 placeholder:text-muted"
        placeholder={tag}
        onKeyDown={(e) => e.stopPropagation()} // prevent modal shortcut conflicts
      />

      {/* Delete */}
      <button
        onClick={onDelete}
        className="text-muted hover:text-red-400 transition-colors cursor-pointer shrink-0 text-sm p-1"
        title="Delete tag"
      >
        🗑
      </button>
    </div>
  );
}
