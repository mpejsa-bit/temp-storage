"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Settings } from "lucide-react";

interface Notification {
  id: string;
  scope_id: string;
  type: string;
  message: string;
  read: number;
  created_at: string;
  fleet_name?: string;
}

interface NotificationPrefs {
  scope_updates: boolean;
  status_changes: boolean;
  comments: boolean;
  collaborator_added: boolean;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const PREF_LABELS: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
  { key: "scope_updates", label: "Scope edits", desc: "When someone edits a scope you own" },
  { key: "status_changes", label: "Status changes", desc: "When a scope status changes" },
  { key: "comments", label: "Comments & mentions", desc: "When someone comments or mentions you" },
  { key: "collaborator_added", label: "Team changes", desc: "When you are added to a scope" },
];

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const unreadCount = notifications.filter((n) => n.read === 0).length;

  async function load() {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch {}
  }

  async function loadPrefs() {
    try {
      const res = await fetch("/api/notifications/preferences", { cache: "no-store" });
      if (res.ok) {
        setPrefs(await res.json());
      }
    } catch {}
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowPrefs(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: 1 } : n))
    );
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
  }

  async function togglePref(key: keyof NotificationPrefs) {
    if (!prefs) return;
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    await fetch("/api/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: updated[key] }),
    });
  }

  function handleClick(n: Notification) {
    if (n.read === 0) markRead(n.id);
    if (n.scope_id) {
      router.push(`/scopes/${n.scope_id}`);
      setOpen(false);
    }
  }

  function openPrefs() {
    setShowPrefs(true);
    if (!prefs) loadPrefs();
  }

  const typeIcons: Record<string, string> = {
    scope_update: "text-blue-400",
    status_change: "text-emerald-400",
    comment: "text-cyan-400",
    mention: "text-violet-400",
    collaborator_added: "text-amber-400",
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center p-2 text-[var(--text-muted)] hover:text-[var(--text)] transition rounded-lg hover:bg-[var(--bg-secondary)]"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <span className="font-semibold text-sm">
              {showPrefs ? "Notification Settings" : "Notifications"}
            </span>
            <div className="flex items-center gap-2">
              {!showPrefs && unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => showPrefs ? setShowPrefs(false) : openPrefs()}
                className="text-[var(--text-muted)] hover:text-[var(--text)] transition p-0.5"
                title={showPrefs ? "Back to notifications" : "Settings"}
              >
                {showPrefs ? (
                  <Bell className="w-3.5 h-3.5" />
                ) : (
                  <Settings className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {showPrefs ? (
            <div className="p-4 space-y-3">
              <p className="text-xs text-[var(--text-muted)] mb-2">Choose which notifications you receive.</p>
              {prefs ? PREF_LABELS.map(({ key, label, desc }) => (
                <button
                  key={key}
                  onClick={() => togglePref(key)}
                  className="w-full flex items-center justify-between py-2 px-1 hover:bg-[var(--bg-secondary)] rounded-lg transition"
                >
                  <div className="text-left">
                    <p className="text-sm text-[var(--text)]">{label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                  </div>
                  <div className={`w-8 h-5 rounded-full transition-colors flex items-center ${prefs[key] ? "bg-blue-600 justify-end" : "bg-[var(--border)] justify-start"}`}>
                    <div className="w-3.5 h-3.5 bg-white rounded-full mx-0.5 transition-all" />
                  </div>
                </button>
              )) : (
                <div className="flex justify-center py-4">
                  <span className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[var(--bg-secondary)] transition border-b border-[var(--border)] last:border-b-0 ${
                      n.read === 0 ? "bg-blue-500/5" : ""
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${typeIcons[n.type] || "text-blue-400"} ${n.read === 0 ? "bg-current" : "bg-[var(--border)]"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${n.read === 0 ? "font-medium text-[var(--text)]" : "text-[var(--text-secondary)]"}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {n.fleet_name && <span className="text-[var(--text-secondary)]">{n.fleet_name} - </span>}
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                    {n.read === 0 && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
