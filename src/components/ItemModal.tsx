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
  const [scraping, setScraping] = useState(false);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  function set(k: keyof ItemFormData, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function scrapeImage(url: string) {
    if (!url) return;
    setScraping(true);
    try {
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`);
      const { image } = await res.json();
      if (image) set("image", image);
    } finally {
      setScraping(false);
    }
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) setForm((f) => ({ ...f, tags: [...f.tags, t] }));
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
            {initial?.name ? "Edit item" : "Add item"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-foreground cursor-pointer text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <Field label="Name *">
            <input ref={nameRef} required value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Sony WH-1000XM5"
              className="input" />
          </Field>

          {/* URL + scrape */}
          <Field label="URL">
            <div className="flex gap-2">
              <input value={form.url} onChange={(e) => set("url", e.target.value)}
                onBlur={(e) => !form.image && scrapeImage(e.target.value)}
                placeholder="https://..."
                className="input flex-1" />
              <button type="button" onClick={() => scrapeImage(form.url)}
                disabled={!form.url || scraping}
                className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-muted hover:text-foreground disabled:opacity-40 cursor-pointer whitespace-nowrap">
                {scraping ? "…" : "Fetch image"}
              </button>
            </div>
          </Field>

          {/* Image */}
          <Field label="Image URL">
            <div className="flex gap-2 items-start">
              <input value={form.image} onChange={(e) => set("image", e.target.value)}
                placeholder="Auto-filled or paste manually"
                className="input flex-1" />
              {form.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image} alt="" className="w-14 h-14 rounded-lg object-cover border border-border shrink-0" />
              )}
            </div>
          </Field>

          {/* Price */}
          <Field label="Price">
            <input value={form.price} onChange={(e) => set("price", e.target.value)}
              placeholder="e.g. $299"
              className="input" />
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              rows={2} placeholder="Short product description"
              className="input resize-none" />
          </Field>

          {/* Notes */}
          <Field label="Your notes">
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
              rows={2} placeholder="Why do you want this? Any personal notes…"
              className="input resize-none" />
          </Field>

          {/* Tags */}
          <Field label="Tags">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tags.map((t) => (
                <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-400 text-xs">
                  {t}
                  <button type="button" onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))}
                    className="cursor-pointer hover:text-white">✕</button>
                </span>
              ))}
            </div>
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Type tag and press Enter"
              className="input" />
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
