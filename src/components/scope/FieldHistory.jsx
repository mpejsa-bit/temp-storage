"use client";
import { useEffect, useState, useRef } from "react";
import { X, Clock } from "lucide-react";

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function FieldHistoryPopover({ scopeId, fieldKey, onClose }) {
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const popRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`/api/scopes/${scopeId}/history?field=${encodeURIComponent(fieldKey)}`);
        if (r.ok) {
          const d = await r.json();
          setChanges(d.changes || []);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [scopeId, fieldKey]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div ref={popRef} className="absolute z-50 top-6 left-0 w-72 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden" style={{ maxHeight: "280px" }}>
      <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
        <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Change History</span>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)]">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: "240px" }}>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : changes.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] text-center py-6">No changes recorded</p>
        ) : (
          <div className="divide-y divide-[var(--border)]/30">
            {changes.map((c, i) => (
              <div key={i} className="px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-blue-400">{c.user_name}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-snug">
                  {c.old_value ? (
                    <>
                      <span className="text-red-400 line-through">
                        {c.old_value.length > 40 ? c.old_value.slice(0, 40) + "..." : c.old_value}
                      </span>
                      {" -> "}
                    </>
                  ) : (
                    <span className="text-[var(--text-muted)] italic">empty</span>
                  )}
                  {c.old_value && !c.new_value ? (
                    <span className="text-[var(--text-muted)] italic"> cleared</span>
                  ) : null}
                  {c.new_value ? (
                    <span className="text-emerald-400">
                      {c.new_value.length > 40 ? c.new_value.slice(0, 40) + "..." : c.new_value}
                    </span>
                  ) : null}
                  {!c.old_value && !c.new_value ? (
                    <span className="text-[var(--text-muted)] italic">no value</span>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FieldHistoryIcon({ scopeId, fieldKey }) {
  const [open, setOpen] = useState(false);
  if (!scopeId || !fieldKey) return null;
  return (
    <span className="relative inline-flex ml-1.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
        className="text-[var(--text-muted)] hover:text-blue-400 transition opacity-0 group-hover/field:opacity-100 focus:opacity-100"
        title="View change history"
      >
        <Clock className="w-3 h-3" />
      </button>
      {open && (
        <FieldHistoryPopover
          scopeId={scopeId}
          fieldKey={fieldKey}
          onClose={() => setOpen(false)}
        />
      )}
    </span>
  );
}
