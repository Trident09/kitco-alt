"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  title: string;
  description: string;
  confirmLabel?: string;        // text user must type to confirm
  confirmPlaceholder?: string;
  actionLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  title,
  description,
  confirmLabel,
  confirmPlaceholder,
  actionLabel = "Confirm",
  variant = "danger",
  onConfirm,
  onClose,
}: Props) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const isValid = confirmLabel ? value === confirmLabel : true;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    onConfirm();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted mt-1">{description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {confirmLabel && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted">
                Type <span className="font-mono text-foreground bg-surface-2 px-1.5 py-0.5 rounded">{confirmLabel}</span> to confirm
              </p>
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={confirmPlaceholder ?? confirmLabel}
                className="input"
                autoComplete="off"
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 cursor-pointer ${
                variant === "danger"
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                  : "bg-violet-600 text-white hover:bg-violet-500"
              }`}
            >
              {actionLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
