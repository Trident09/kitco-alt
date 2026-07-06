"use client";

import { useEffect, useRef, useState } from "react";
import type { StashItem } from "@/types";

type ItemFormData = Pick<StashItem, "name" | "url" | "image" | "price" | "description" | "notes" | "tags">;

interface Props {
  initial?: Partial<ItemFormData>;
  existingTags?: string[];      // all tags already used in this stash
  onSave: (data: ItemFormData) => Promise<void>;
  onClose: () => void;
}

const EMPTY: ItemFormData = { name: "", url: "", image: "", price: "", description: "", notes: "", tags: [] };

export default function ItemModal({ initial, existingTags = [], onSave, onClose }: Props) {
  const [form, setForm] = useState<ItemFormData>({ ...EMPTY, ...initial });
  const [tagInput, setTagInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filling, setFilling] = useState(false);
  const [filled, setFilled] = useState(false);
  const urlDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const isEdit = !!initial?.name;

  useEffect(() => { nameRef.current?.focus(); }, []);

  // Escape to close
  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (showSuggestions) { setShowSuggestions(false); return; }
        onClose();
      }
    }
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [onClose, showSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        tagInputRef.current &&
        !tagInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

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

  /** Add one or more tags (handles comma-separated input) */
  function addTags(raw: string) {
    const parts = raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0 && !form.tags.includes(s));
    if (parts.length > 0) {
      set("tags", [...form.tags, ...parts]);
    }
    setTagInput("");
    setShowSuggestions(false);
  }

  function removeTag(t: string) {
    set("tags", form.tags.filter((x) => x !== t));
  }

  /** Suggestions: existing stash tags not yet on this item, filtered by current input */
  const suggestions = existingTags.filter(
    (t) =>
      !form.tags.includes(t) &&
      (tagInput.trim() === "" || t.includes(tagInput.trim().toLowerCase()))
  );

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (tagInput.trim()) addTags(tagInput);
      return;
    }
    if (e.key === ",") {
      e.preventDefault();
      if (tagInput.trim()) addTags(tagInput);
      return;
    }
    if (e.key === "Backspace" && tagInput === "" && form.tags.length > 0) {
      // Remove last tag on backspace when input is empty
      set("tags", form.tags.slice(0, -1));
      return;
    }
    if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      const first = suggestionsRef.current?.querySelector("button");
      (first as HTMLButtonElement | null)?.focus();
      return;
    }
  }

  function handleTagInputChange(v: string) {
    setTagInput(v);
    setShowSuggestions(true);
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
            {/* Current tags as pills */}
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-400 text-xs">
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="cursor-pointer hover:text-white ml-0.5 leading-none"
                      aria-label={`Remove tag ${t}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Input + suggestions container */}
            <div className="relative">
              <input
                ref={tagInputRef}
                value={tagInput}
                onChange={(e) => handleTagInputChange(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onFocus={() => setShowSuggestions(true)}
                placeholder={
                  existingTags.length > 0
                    ? "Type or pick a tag… (comma or Enter to add)"
                    : "Type a tag and press Enter or comma"
                }
                className="input"
                autoComplete="off"
              />

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-1 z-10 bg-surface border border-border rounded-xl shadow-xl overflow-hidden"
                >
                  <p className="text-[10px] text-muted px-3 pt-2 pb-1 uppercase tracking-wider">
                    {tagInput.trim() ? "Matching tags" : "Tags used in this stash"}
                  </p>
                  <div className="max-h-40 overflow-y-auto pb-1">
                    {suggestions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault(); // don't blur input
                          addTags(tag);
                          tagInputRef.current?.focus();
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-surface-2 flex items-center gap-2 cursor-pointer"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted mt-1.5">
              Press <kbd className="px-1 py-0.5 rounded bg-surface-2 border border-border font-mono text-[10px]">Enter</kbd> or <kbd className="px-1 py-0.5 rounded bg-surface-2 border border-border font-mono text-[10px]">,</kbd> to add · <kbd className="px-1 py-0.5 rounded bg-surface-2 border border-border font-mono text-[10px]">⌫</kbd> to remove last
            </p>
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
