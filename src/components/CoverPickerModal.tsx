"use client";

import { useEffect, useState } from "react";
import { STASH_COVERS, getCoverById } from "@/lib/stash-covers";

interface Props {
  current: string;
  onSave: (coverId: string) => Promise<void>;
  onClose: () => void;
}

export default function CoverPickerModal({ current, onSave, onClose }: Props) {
  const [selected, setSelected] = useState(current || STASH_COVERS[0].id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSave() {
    if (selected === current) { onClose(); return; }
    setSaving(true);
    await onSave(selected);
    setSaving(false);
  }

  const preview = getCoverById(selected);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg flex flex-col max-h-[90vh] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold text-foreground">Choose a cover</h2>
            <p className="text-xs text-muted mt-0.5">Pick an illustration for this stash</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground cursor-pointer text-lg leading-none">✕</button>
        </div>

        {/* Preview strip */}
        <div className="px-5 pt-4 shrink-0">
          <div className="w-full h-28 rounded-xl border border-border bg-surface-2 overflow-hidden flex items-center justify-center text-violet-400 relative">
            {/* Subtle radial glow behind illustration */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.12)_0%,transparent_70%)]" />
            <div className="relative w-full h-full p-4">
              {preview.svg}
            </div>
          </div>
          <p className="text-xs text-muted text-center mt-2">{preview.label}</p>
        </div>

        {/* Grid picker */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-4 gap-3">
            {STASH_COVERS.map((cover) => {
              const isSelected = cover.id === selected;
              return (
                <button
                  key={cover.id}
                  onClick={() => setSelected(cover.id)}
                  className={`group relative aspect-[3/2] rounded-lg border overflow-hidden transition-all cursor-pointer ${
                    isSelected
                      ? "border-violet-500 shadow-[0_0_0_2px_rgba(139,92,246,0.35)]"
                      : "border-border hover:border-violet-500/40"
                  }`}
                  title={cover.label}
                >
                  {/* Background */}
                  <div className={`absolute inset-0 ${isSelected ? "bg-violet-600/10" : "bg-surface-2 group-hover:bg-violet-600/5"} transition-colors`} />
                  {/* SVG illustration */}
                  <div className={`absolute inset-0 p-2 ${isSelected ? "text-violet-400" : "text-violet-500/50 group-hover:text-violet-500/70"} transition-colors`}>
                    {cover.svg}
                  </div>
                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center">
                      <span className="text-[8px] text-white font-bold">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex gap-2 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-border text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            {saving ? "Saving…" : "Apply cover"}
          </button>
        </div>

      </div>
    </div>
  );
}
