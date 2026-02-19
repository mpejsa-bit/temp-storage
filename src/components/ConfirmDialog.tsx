"use client";
import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", destructive, onConfirm, onCancel }: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">Cancel</button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`px-5 py-2 rounded-lg text-sm font-medium text-white ${destructive ? "bg-red-600 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-500"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
