"use client";

import { useEffect, useRef, useState } from "react";

export interface ShortcutEntry {
  keys: string[];
  label: string;
}

interface Props {
  shortcuts: ShortcutEntry[];
}

export default function KeyboardShortcutsLegend({ shortcuts }: Props) {
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on Escape
  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setVisible(false);
    }
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  function handleMouseEnter() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(true);
  }

  function handleMouseLeave() {
    hideTimer.current = setTimeout(() => setVisible(false), 200);
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-[100]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Popup panel — appears above the button, aligned to the right */}
      {visible && (
        <div className="absolute bottom-12 right-0 w-72 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <span className="text-violet-400 text-sm">⌨</span>
            <span className="text-xs font-semibold text-foreground">Keyboard Shortcuts</span>
          </div>

          {/* List */}
          <ul className="p-2">
            {shortcuts.map((s, i) => (
              <li
                key={i}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors"
              >
                <span className="text-xs text-muted">{s.label}</span>
                <div className="flex items-center gap-1">
                  {s.keys.map((k, ki) => (
                    <span key={ki} className="flex items-center gap-0.5">
                      {ki > 0 && <span className="text-muted/40 text-[10px] mx-0.5">+</span>}
                      <kbd className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded bg-surface-2 border border-border text-foreground text-[11px] font-mono font-medium">
                        {k}
                      </kbd>
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Floating trigger button */}
      <button
        onClick={() => setVisible((v) => !v)}
        title="Keyboard shortcuts"
        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm border transition-all cursor-pointer shadow-lg ${
          visible
            ? "bg-violet-600 border-violet-500 text-white"
            : "bg-surface border-border text-muted hover:text-foreground hover:border-violet-500/50 hover:bg-surface-2"
        }`}
      >
        ⌨
      </button>
    </div>
  );
}
