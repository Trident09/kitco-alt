"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from "@/context/AuthContext";
import { subscribeItems, createItem, updateItem, deleteItem, reorderItems } from "@/lib/items";
import { subscribeLists } from "@/lib/lists";
import type { StashItem, StashList } from "@/types";
import ItemModal from "@/components/ItemModal";
import SearchModal from "@/components/SearchModal";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/context/ToastContext";

type ItemFormData = Pick<StashItem, "name" | "url" | "image" | "price" | "description" | "notes" | "tags">;

function parsePrice(price: string): number {
  const cleaned = price.replace(/[^0-9.,]/g, "").replace(",", "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function formatTotal(total: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  }).format(total);
}

/** Build ordered tag sections from a list of items.
 *  - Tags appear in the order they were first encountered (by item.order).
 *  - Items with multiple tags appear under each of their tags.
 *  - Untagged items are returned separately.
 */
function buildTagSections(items: StashItem[]): {
  sections: { tag: string; items: StashItem[] }[];
  untagged: StashItem[];
} {
  const tagOrder: string[] = [];
  const tagMap = new Map<string, StashItem[]>();

  for (const item of items) {
    for (const t of item.tags) {
      if (!tagMap.has(t)) {
        tagOrder.push(t);
        tagMap.set(t, []);
      }
      tagMap.get(t)!.push(item);
    }
  }

  // Sort tag names alphabetically
  const sorted = [...tagOrder].sort();

  const sections = sorted.map((tag) => ({ tag, items: tagMap.get(tag)! }));
  const untagged = items.filter((i) => i.tags.length === 0);

  return { sections, untagged };
}

/* ═══════════════════════════════════════════════════════════ */

export default function ListDetailPage() {
  const { listId } = useParams<{ listId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [list, setList] = useState<StashList | null>(null);
  const [items, setItems] = useState<StashItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<StashItem | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (!user) return;
    const unsub1 = subscribeLists(user.uid, (lists) => {
      const found = lists.find((l) => l.id === listId);
      if (found) setList(found);
    });
    const unsub2 = subscribeItems(listId, setItems);
    return () => { unsub1(); unsub2(); };
  }, [user, listId]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.key === "Escape" && !showModal && !editItem) {
        if (search || activeTag) { setSearch(""); setActiveTag(null); }
        return;
      }
      if (inInput) return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setShowModal(true); return; }
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); return; }
      if (e.key === "f" || e.key === "F") { e.preventDefault(); setShowSearch(true); return; }
      if (e.key === "s" || e.key === "S") { e.preventDefault(); router.push(`/dashboard/list/${listId}/settings`); return; }
      if (e.key === "Backspace") { e.preventDefault(); router.push("/dashboard"); return; }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [listId, router, search, activeTag, showModal, editItem]);

  async function handleAdd(data: ItemFormData) {
    if (!user) return;
    await createItem({ ...data, listId, uid: user.uid, purchased: false }, items.length);
    setShowModal(false);
    showToast("Item added");
  }

  async function handleEdit(data: ItemFormData) {
    if (!editItem) return;
    await updateItem(editItem.id, data);
    setEditItem(null);
    showToast("Item saved");
  }

  async function handleDelete(item: StashItem) {
    await deleteItem(item.id);
    showToast(`"${item.name}" deleted`, "error");
  }

  async function handleTogglePurchased(item: StashItem) {
    const next = !item.purchased;
    await updateItem(item.id, { purchased: next });
    showToast(next ? `Marked "${item.name}" as purchased` : `Unmarked "${item.name}"`);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIdx, newIdx).map((item, idx) => ({ ...item, order: idx }));
    setItems(reordered);
    await reorderItems(reordered.map(({ id, order }) => ({ id, order })));
  }

  const allTags = Array.from(new Set(items.flatMap((i) => i.tags))).sort();
  const hasAnyTags = allTags.length > 0;

  // Apply search + tag filter
  const filtered = items.filter((i) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || (
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.tags.some((t) => t.includes(q))
    );
    const matchesTag = !activeTag || i.tags.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  const totalPrice = items.reduce((sum, i) => sum + parsePrice(i.price), 0);
  const purchasedCount = items.filter((i) => i.purchased).length;

  const handleTagClick = useCallback((tag: string) => {
    setActiveTag((prev) => (prev === tag ? null : tag));
  }, []);

  // Build sections from filtered items
  const { sections, untagged } = buildTagSections(filtered);

  // Total section count for display
  const sectionCount = sections.length + (untagged.length > 0 ? 1 : 0);

  if (!list) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-xs text-muted hover:text-foreground mb-4 flex items-center gap-1 cursor-pointer"
        >
          ← Back
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold text-foreground">{list.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                list.isPublic ? "bg-violet-600/20 text-violet-400" : "bg-surface-2 text-muted"
              }`}>
                {list.isPublic ? "Public" : "Private"}
              </span>
            </div>
            {list.description && (
              <p className="text-sm text-muted mt-1">{list.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted flex-wrap">
              <span>{items.length} item{items.length !== 1 ? "s" : ""}</span>
              {hasAnyTags && (
                <>
                  <span>·</span>
                  <span>{allTags.length} tag{allTags.length !== 1 ? "s" : ""}</span>
                </>
              )}
              {totalPrice > 0 && (
                <>
                  <span>·</span>
                  <span className="text-foreground font-medium">{formatTotal(totalPrice)} total</span>
                </>
              )}
              {purchasedCount > 0 && (
                <>
                  <span>·</span>
                  <span className="text-green-400">{purchasedCount} purchased</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => router.push(`/dashboard/list/${list.id}/settings`)}
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface border border-transparent hover:border-border transition-colors cursor-pointer"
              title="Stash settings (S)"
            >
              ⚙
            </button>
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border hover:border-violet-500/50 text-foreground text-sm font-medium cursor-pointer transition-colors"
              title="Search web for products (F)"
            >
              <span className="text-base leading-none">🔍</span>
              Search web
              <kbd className="hidden sm:inline-flex items-center text-[10px] px-1 py-0.5 rounded bg-surface-2 text-muted font-mono ml-1">F</kbd>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium cursor-pointer"
              title="Add item (N)"
            >
              <span className="text-base leading-none">+</span>
              Add item
              <kbd className="hidden sm:inline-flex items-center text-[10px] px-1 py-0.5 rounded bg-violet-700/60 text-violet-300 font-mono ml-1">N</kbd>
            </button>
          </div>
        </div>
      </div>

      {/* ── Search + tag filter pills ── */}
      {items.length > 0 && (
        <div className="mb-8 space-y-3">
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setSearch(""); searchRef.current?.blur(); }
            }}
            placeholder="Search items…"
            className="input max-w-sm"
          />
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    activeTag === tag
                      ? "bg-violet-600 border-violet-600 text-white"
                      : "bg-violet-600/10 border-violet-500/20 text-violet-400 hover:bg-violet-600/20"
                  }`}
                >
                  {tag}
                </button>
              ))}
              {activeTag && (
                <button
                  onClick={() => setActiveTag(null)}
                  className="px-2.5 py-1 rounded-full text-xs text-muted hover:text-foreground border border-border transition-colors cursor-pointer"
                >
                  Clear ✕
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-4xl mb-4 opacity-30">⊹</div>
          <p className="text-muted text-sm">
            {search || activeTag ? "No items match your filters." : "No items yet. Add your first one."}
          </p>
          {(search || activeTag) && (
            <button
              onClick={() => { setSearch(""); setActiveTag(null); }}
              className="mt-3 text-xs text-violet-400 hover:text-violet-300 cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

      ) : !hasAnyTags ? (
        /* ── Flat sortable list (no tags exist at all) ── */
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {filtered.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  onEdit={() => setEditItem(item)}
                  onDelete={() => handleDelete(item)}
                  onTogglePurchased={() => handleTogglePurchased(item)}
                  onTagClick={handleTagClick}
                  activeTag={activeTag}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

      ) : (
        /* ── Tag sections ── */
        <div className="space-y-10">
          {sections.map(({ tag, items: sectionItems }) => (
            <TagSection
              key={tag}
              tag={tag}
              items={sectionItems}
              allSectionCount={sectionCount}
              onEdit={setEditItem}
              onDelete={handleDelete}
              onTogglePurchased={handleTogglePurchased}
              onTagClick={handleTagClick}
              activeTag={activeTag}
            />
          ))}

          {untagged.length > 0 && (
            <TagSection
              tag=""
              items={untagged}
              allSectionCount={sectionCount}
              onEdit={setEditItem}
              onDelete={handleDelete}
              onTogglePurchased={handleTogglePurchased}
              onTagClick={handleTagClick}
              activeTag={activeTag}
            />
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {showSearch && (
        <SearchModal
          existingTags={allTags}
          onAdd={async (data) => {
            if (!user) return;
            await createItem({ ...data, listId, uid: user.uid, purchased: false }, items.length);
            showToast(`"${data.name}" added`);
          }}
          onClose={() => setShowSearch(false)}
        />
      )}
      {showModal && (
        <ItemModal
          existingTags={allTags}
          onSave={handleAdd}
          onClose={() => setShowModal(false)}
        />
      )}
      {editItem && (
        <ItemModal
          initial={editItem}
          existingTags={allTags}
          onSave={handleEdit}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  );
}

/* ─── Tag Section ─────────────────────────────────────────── */

function TagSection({
  tag, items, allSectionCount, onEdit, onDelete, onTogglePurchased, onTagClick, activeTag,
}: {
  tag: string;
  items: StashItem[];
  allSectionCount: number;
  onEdit: (item: StashItem) => void;
  onDelete: (item: StashItem) => void;
  onTogglePurchased: (item: StashItem) => void;
  onTagClick: (tag: string) => void;
  activeTag: string | null;
}) {
  const isUntagged = tag === "";
  const sectionPrice = items.reduce((s, i) => s + parsePrice(i.price), 0);
  const purchasedHere = items.filter((i) => i.purchased).length;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        {isUntagged ? (
          <span className="text-xs font-semibold text-muted uppercase tracking-wider px-2.5 py-1 rounded-full bg-surface-2 border border-border">
            Untagged
          </span>
        ) : (
          <button
            onClick={() => onTagClick(tag)}
            className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
              activeTag === tag
                ? "bg-violet-600 border-violet-600 text-white"
                : "bg-violet-600/10 border-violet-500/20 text-violet-400 hover:bg-violet-600/20"
            }`}
          >
            {tag}
          </button>
        )}

        <div className="flex items-center gap-2 text-xs text-muted">
          <span>{items.length} item{items.length !== 1 ? "s" : ""}</span>
          {sectionPrice > 0 && (
            <>
              <span>·</span>
              <span className="text-foreground font-medium">{formatTotal(sectionPrice)}</span>
            </>
          )}
          {purchasedHere > 0 && (
            <>
              <span>·</span>
              <span className="text-green-400">{purchasedHere} purchased</span>
            </>
          )}
        </div>

        {/* Rule fills remaining space */}
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Items in section */}
      <div className="space-y-3">
        {items.map((item) => (
          <ItemRow
            key={`${tag}-${item.id}`}
            item={item}
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item)}
            onTogglePurchased={() => onTogglePurchased(item)}
            onTagClick={onTagClick}
            activeTag={activeTag}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Item row (inside a tag section) ────────────────────── */

function ItemRow({
  item, onEdit, onDelete, onTogglePurchased, onTagClick, activeTag,
}: {
  item: StashItem;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePurchased: () => void;
  onTagClick: (tag: string) => void;
  activeTag: string | null;
}) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <>
      <div className={`group flex gap-4 p-4 rounded-xl border bg-surface transition-all border-border hover:border-violet-500/40 ${item.purchased ? "opacity-60" : ""}`}>
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image} alt={item.name}
            className={`w-16 h-16 rounded-lg object-cover border border-border shrink-0 ${item.purchased ? "grayscale" : ""}`}
          />
        ) : (
          <div className="w-16 h-16 rounded-lg border border-border bg-surface-2 flex items-center justify-center text-muted text-xl shrink-0">◈</div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className={`font-medium text-foreground text-sm truncate ${item.purchased ? "line-through text-muted" : ""}`}>
                {item.name}
              </h3>
              <div className="flex items-center gap-2">
                {item.price && (
                  <span className={`text-sm font-medium ${item.purchased ? "text-muted line-through" : "text-violet-400"}`}>
                    {item.price}
                  </span>
                )}
                {item.purchased && (
                  <span className="text-xs text-green-400 font-medium">✓ Purchased</span>
                )}
              </div>
            </div>

            {/* Action buttons — visible on hover */}
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onTogglePurchased}
                title={item.purchased ? "Mark as unpurchased" : "Mark as purchased"}
                className={`p-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                  item.purchased ? "text-green-400 hover:text-muted hover:bg-surface-2" : "text-muted hover:text-green-400 hover:bg-surface-2"
                }`}
              >✓</button>
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-2 text-xs" title="Open link">↗</a>
              )}
              <button onClick={onEdit}
                className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-2 text-xs cursor-pointer">✎</button>
              <button onClick={() => setShowDelete(true)}
                className="p-1.5 rounded-md text-muted hover:text-red-400 hover:bg-surface-2 text-xs cursor-pointer">🗑</button>
            </div>
          </div>

          {item.description && (
            <p className="text-xs text-muted mt-1 line-clamp-2">{item.description}</p>
          )}
          {item.notes && (
            <p className="text-xs text-muted/70 mt-1 italic line-clamp-1">&ldquo;{item.notes}&rdquo;</p>
          )}

          {/* Tags — clicking them filters to that tag */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map((t) => (
                <button key={t} onClick={() => onTagClick(t)}
                  className={`px-1.5 py-0.5 rounded-full text-xs transition-colors cursor-pointer ${
                    activeTag === t ? "bg-violet-600 text-white" : "bg-violet-600/10 text-violet-400 hover:bg-violet-600/20"
                  }`}
                >{t}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showDelete && (
        <ConfirmModal
          title="Delete item?"
          description={`"${item.name}" will be permanently removed from this stash.`}
          confirmLabel="delete"
          confirmPlaceholder="type delete to confirm"
          actionLabel="Delete item"
          onConfirm={onDelete}
          onClose={() => setShowDelete(false)}
        />
      )}
    </>
  );
}

/* ─── Sortable item (flat view, no tags exist) ────────────── */

function SortableItem({
  item, onEdit, onDelete, onTogglePurchased, onTagClick, activeTag,
}: {
  item: StashItem;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePurchased: () => void;
  onTagClick: (tag: string) => void;
  activeTag: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [showDelete, setShowDelete] = useState(false);
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <>
      <div
        ref={setNodeRef} style={style}
        className={`group flex gap-4 p-4 rounded-xl border bg-surface transition-all ${
          isDragging ? "border-violet-500 opacity-80 shadow-lg" : "border-border hover:border-violet-500/40"
        } ${item.purchased ? "opacity-60" : ""}`}
      >
        <button {...attributes} {...listeners}
          className="flex items-center text-muted hover:text-foreground cursor-grab active:cursor-grabbing mt-1 shrink-0"
          aria-label="Drag to reorder">⠿</button>

        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.name}
            className={`w-16 h-16 rounded-lg object-cover border border-border shrink-0 ${item.purchased ? "grayscale" : ""}`} />
        ) : (
          <div className="w-16 h-16 rounded-lg border border-border bg-surface-2 flex items-center justify-center text-muted text-xl shrink-0">◈</div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className={`font-medium text-foreground text-sm truncate ${item.purchased ? "line-through text-muted" : ""}`}>
                {item.name}
              </h3>
              <div className="flex items-center gap-2">
                {item.price && (
                  <span className={`text-sm font-medium ${item.purchased ? "text-muted line-through" : "text-violet-400"}`}>{item.price}</span>
                )}
                {item.purchased && <span className="text-xs text-green-400 font-medium">✓ Purchased</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={onTogglePurchased}
                title={item.purchased ? "Mark as unpurchased" : "Mark as purchased"}
                className={`p-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                  item.purchased ? "text-green-400 hover:text-muted hover:bg-surface-2" : "text-muted hover:text-green-400 hover:bg-surface-2"
                }`}>✓</button>
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-2 text-xs" title="Open link">↗</a>
              )}
              <button onClick={onEdit}
                className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-2 text-xs cursor-pointer">✎</button>
              <button onClick={() => setShowDelete(true)}
                className="p-1.5 rounded-md text-muted hover:text-red-400 hover:bg-surface-2 text-xs cursor-pointer">🗑</button>
            </div>
          </div>
          {item.description && <p className="text-xs text-muted mt-1 line-clamp-2">{item.description}</p>}
          {item.notes && <p className="text-xs text-muted/70 mt-1 italic line-clamp-1">&ldquo;{item.notes}&rdquo;</p>}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map((t) => (
                <button key={t} onClick={() => onTagClick(t)}
                  className={`px-1.5 py-0.5 rounded-full text-xs transition-colors cursor-pointer ${
                    activeTag === t ? "bg-violet-600 text-white" : "bg-violet-600/10 text-violet-400 hover:bg-violet-600/20"
                  }`}>{t}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showDelete && (
        <ConfirmModal
          title="Delete item?"
          description={`"${item.name}" will be permanently removed from this stash.`}
          confirmLabel="delete"
          confirmPlaceholder="type delete to confirm"
          actionLabel="Delete item"
          onConfirm={onDelete}
          onClose={() => setShowDelete(false)}
        />
      )}
    </>
  );
}
