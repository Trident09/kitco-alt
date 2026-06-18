"use client";

import { useEffect, useState } from "react";
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
import { subscribeItems, createItem, updateItem, deleteItem, reorderItems, type ItemInput } from "@/lib/items";
import { subscribeLists } from "@/lib/lists";
import type { StashItem, StashList } from "@/types";
import ItemModal from "@/components/ItemModal";
import ConfirmModal from "@/components/ConfirmModal";

export default function ListDetailPage() {
  const { listId } = useParams<{ listId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [list, setList] = useState<StashList | null>(null);
  const [items, setItems] = useState<StashItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<StashItem | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (!user) return;
    const unsub1 = subscribeLists(user.uid, (lists) => {
      const found = lists.find((l) => l.id === listId);
      if (!found) return;
      setList(found);
    });
    const unsub2 = subscribeItems(listId, setItems);
    return () => { unsub1(); unsub2(); };
  }, [user, listId]);

  async function handleAdd(data: Omit<ItemInput, "listId" | "uid">) {
    if (!user) return;
    await createItem({ ...data, listId, uid: user.uid }, items.length);
    setShowModal(false);
  }

  async function handleEdit(data: Omit<ItemInput, "listId" | "uid">) {
    if (!editItem) return;
    await updateItem(editItem.id, data);
    setEditItem(null);
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

  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? items.filter((i) => {
        const q = search.toLowerCase();
        return (
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.tags.some((t) => t.includes(q))
        );
      })
    : items;

  if (!list) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-xs text-muted hover:text-foreground mb-4 flex items-center gap-1 cursor-pointer"
        >
          ← Back
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">{list.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full ${list.isPublic ? "bg-violet-600/20 text-violet-400" : "bg-surface-2 text-muted"}`}>
                {list.isPublic ? "Public" : "Private"}
              </span>
            </div>
            {list.description && <p className="text-sm text-muted mt-1">{list.description}</p>}
            <p className="text-xs text-muted mt-1">{items.length} item{items.length !== 1 ? "s" : ""}</p>          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => router.push(`/dashboard/list/${list.id}/settings`)}
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface border border-transparent hover:border-border transition-colors cursor-pointer"
              title="Stash settings"
            >
              ⚙
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium cursor-pointer"
            >
              <span className="text-base leading-none">+</span>
              Add item
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      {items.length > 0 && (
        <div className="mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, description, or tag…"
            className="input max-w-sm"
          />
        </div>
      )}

      {/* Items */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-4xl mb-4 opacity-30">⊹</div>
          <p className="text-muted text-sm">
            {search ? `No items match "${search}"` : "No items yet. Add your first one."}
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {filtered.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  onEdit={() => setEditItem(item)}
                  onDelete={() => deleteItem(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {showModal && (
        <ItemModal
          onSave={(data) => handleAdd(data)}
          onClose={() => setShowModal(false)}
        />
      )}
      {editItem && (
        <ItemModal
          initial={editItem}
          onSave={(data) => handleEdit(data)}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  );
}

function SortableItem({
  item, onEdit, onDelete,
}: {
  item: StashItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [showDelete, setShowDelete] = useState(false);

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`group flex gap-4 p-4 rounded-xl border bg-surface transition-colors ${
          isDragging ? "border-violet-500 opacity-80 shadow-lg" : "border-border hover:border-violet-500/40"
        }`}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex items-center text-muted hover:text-foreground cursor-grab active:cursor-grabbing mt-1 shrink-0"
          aria-label="Drag to reorder"
        >
          ⠿
        </button>

        {/* Image */}
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.name}
            className="w-16 h-16 rounded-lg object-cover border border-border shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg border border-border bg-surface-2 flex items-center justify-center text-muted text-xl shrink-0">
            ◈
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-foreground text-sm truncate">{item.name}</h3>
              {item.price && <span className="text-violet-400 text-sm font-medium">{item.price}</span>}
            </div>
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-2 text-xs"
                  title="Open link">
                  ↗
                </a>
              )}
              <button onClick={onEdit}
                className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-2 text-xs cursor-pointer">
                ✎
              </button>
              <button onClick={() => setShowDelete(true)}
                className="p-1.5 rounded-md text-muted hover:text-red-400 hover:bg-surface-2 text-xs cursor-pointer">
                🗑
              </button>
            </div>
          </div>

          {item.description && (
            <p className="text-xs text-muted mt-1 line-clamp-2">{item.description}</p>
          )}
          {item.notes && (
            <p className="text-xs text-muted/70 mt-1 italic line-clamp-1">"{item.notes}"</p>
          )}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map((t) => (
                <span key={t} className="px-1.5 py-0.5 rounded-full bg-violet-600/10 text-violet-400 text-xs">
                  {t}
                </span>
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
