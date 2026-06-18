"use client";

import { useEffect, useRef, useState } from "react";
import type { StashItem } from "@/types";

type ItemFormData = Pick<StashItem, "name" | "url" | "image" | "price" | "description" | "notes" | "tags">;

interface Props {
  initial?: Partial<ItemFormData>;
  onSave: (data: ItemFormData) => Promise<void>;
  onClose: () => void;
}

const EMPTY: ItemFormData = { name: "", url: "", image: "", price: "", description: "", notes: "", tags: [] };

export default function ItemModal({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<ItemFormData>({ ...EMPTY, ...initial });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [filling, setFilling] = useState(false);
  const [filled, setFilled] = useState(false);
  const urlDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const isEdit = !!initial?.name;

  useEffect(() => { nameRef.current?.focus(); }, []);

  function set<K extends keyof ItemFormData>(k: K, v: ItemFormData[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function autofill(url: string) {
    if (!url || isEdit) return;
    setFilling(true);
    setFilled(false);
    try {
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      setForm((f) => ({
        ...f,
        name: f.name || data.name || f.name,
        image: f.image || data.image || f.image,
        price: f.price || data.price || f.price,
        description: f.description || data.description || f.description,
      }));
      if (data.name || data.image) setFilled(true);
    } finally {
      setFilling(false);
    }
  }

  function handleUrlChange(url: string) {
    set("url", url);
    if (urlDebounce.current) clearTimeout(urlDebounce.current);
    if (!url.startsWith("http")) return;
    urlDebounce.current = setTimeout(() => autofill(url), 800);
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
    setTagInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            {isEdit ? "Edit item" : "Add item"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-foreground cursor-pointer text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* URL first — triggers autofill */}
          <Field label="URL">
            <div className="relative">
              <input
                value={form.url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Paste a product link to auto-fill…"
                className="input pr-20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none">
                {filling && <span className="text-violet-400 animate-pulse">Filling…</span>}
                {!filling && filled && <span className="text-green-400">✓ Filled</span>}
              </span>
            </div>
          </Field>

          {/* Name */}
          <Field label="Name *">
            <input
              ref={nameRef}
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Sony WH-1000XM5"
              className="input"
            />
          </Field>

          {/* Image */}
          <Field label="Image URL">
            <div className="flex gap-2 items-start">
              <input
                value={form.image}
                onChange={(e) => set("image", e.target.value)}
                placeholder="Auto-filled or paste manually"
                className="input flex-1"
              />
              {form.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image} alt="" className="w-14 h-14 rounded-lg object-cover border border-border shrink-0" />
              )}
            </div>
          </Field>

          {/* Price */}
          <Field label="Price">
            <input
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="e.g. $299"
              className="input"
            />
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              placeholder="Short product description"
              className="input resize-none"
            />
          </Field>

          {/* Notes */}
          <Field label="Your notes">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Why do you want this?"
              className="input resize-none"
            />
          </Field>

          {/* Tags */}
          <Field label="Tags">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tags.map((t) => (
                <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-400 text-xs">
                  {t}
                  <button
                    type="button"
                    onClick={() => set("tags", form.tags.filter((x) => x !== t))}
                    className="cursor-pointer hover:text-white"
                  >✕</button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Type tag and press Enter"
              className="input"
            />
          </Field>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm text-muted hover:text-foreground transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={saving || !form.name.trim()}
              className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium transition-colors cursor-pointer">
              {saving ? "Saving…" : "Save item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted">{label}</label>
      {children}
    </div>
  );
}
