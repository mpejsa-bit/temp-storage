"use client";
import { useEffect, useState, useCallback } from "react";
import { MessageSquare, Trash2, Send } from "lucide-react";

interface Comment {
  id: string;
  scope_id: string;
  section: string;
  user_id: string;
  user_name: string;
  text: string;
  created_at: string;
}

interface CommentsProps {
  scopeId: string;
  section: string;
  currentUserId: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Comments({ scopeId, section, currentUserId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/scopes/${scopeId}/comments?section=${encodeURIComponent(section)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        setComments(await res.json());
      }
    } catch {}
    setLoading(false);
  }, [scopeId, section]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/scopes/${scopeId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, text: trimmed }),
      });
      if (res.ok) {
        setText("");
        await loadComments();
      }
    } catch {}
    setSubmitting(false);
  }

  async function handleDelete(commentId: string) {
    try {
      const res = await fetch(`/api/scopes/${scopeId}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: commentId }),
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch {}
  }

  return (
    <div className="mt-4 border-t border-[var(--border)] pt-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-[var(--text-muted)]" />
        <span className="text-sm font-medium text-[var(--text-secondary)]">
          Comments{comments.length > 0 ? ` (${comments.length})` : ""}
        </span>
      </div>

      {/* Comment list */}
      {loading ? (
        <div className="text-xs text-[var(--text-muted)] py-2">Loading comments...</div>
      ) : (
        <div className="space-y-3 mb-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className="group bg-[var(--bg-secondary)] rounded-lg px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-[var(--text)]">
                    {c.user_name}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {timeAgo(c.created_at)}
                  </span>
                </div>
                {c.user_id === currentUserId && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-red-400 transition"
                    title="Delete comment"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-1 whitespace-pre-wrap break-words">
                {c.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          rows={1}
          className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 resize-none transition"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center"
          title="Send comment"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
