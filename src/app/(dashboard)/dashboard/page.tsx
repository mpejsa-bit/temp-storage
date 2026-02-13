"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Plus, FileText, Clock, Users, Search, LogOut, MoreVertical,
  Trash2, Copy, ExternalLink, ChevronRight, Layers
} from "lucide-react";

interface Scope {
  id: string;
  fleet_name: string;
  status: string;
  role: string;
  owner_name: string;
  created_at: string;
  updated_at: string;
  share_token?: string;
  share_access?: string;
}

export default function DashboardPage() {
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState("");
  const router = useRouter();

  async function fetchScopes() {
    try {
      setFetchError("");
      const res = await fetch("/api/scopes", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setScopes(Array.isArray(data) ? data : []);
      } else {
        setFetchError(`Failed to load (${res.status})`);
      }
    } catch (e) {
      setFetchError("Network error loading documents");
    }
    setLoading(false);
  }

  useEffect(() => { fetchScopes(); }, []);

  async function createScope() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/scopes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fleet_name: newName }),
    });
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/scopes/${id}`);
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this scoping doc? This cannot be undone.")) return;
    await fetch(`/api/scopes/${id}`, { method: "DELETE" });
    setScopes(scopes.filter(s => s.id !== id));
    setMenuOpen(null);
  }

  async function handleClone(id: string) {
    const res = await fetch(`/api/scopes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "clone" }),
    });
    if (res.ok) {
      const { id: newId } = await res.json();
      router.push(`/scopes/${newId}`);
    }
    setMenuOpen(null);
  }

  const filtered = scopes.filter(s =>
    s.fleet_name.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    draft: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    archived: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };

  const roleColors: Record<string, string> = {
    owner: "text-blue-400",
    editor: "text-emerald-400",
    viewer: "text-amber-400",
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[#2a3a55] bg-[#111827]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-blue-400" />
            <span className="font-bold text-lg">Scoping Doc Platform</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 text-sm text-[#64748b] hover:text-white transition"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Title + Actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Scoping Documents</h1>
            <p className="text-[#64748b] text-sm">{scopes.length} document{scopes.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            New Scoping Doc
          </button>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
            <div className="bg-[#1a2234] border border-[#2a3a55] rounded-xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">New Scoping Document</h2>
              <label className="block text-sm text-[#94a3b8] mb-2">Fleet Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Acme Trucking"
                className="w-full px-4 py-3 bg-[#111827] border border-[#2a3a55] rounded-lg text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500 mb-6"
                autoFocus
                onKeyDown={e => e.key === "Enter" && createScope()}
              />
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-[#94a3b8] hover:text-white transition">Cancel</button>
                <button
                  onClick={createScope}
                  disabled={creating || !newName.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg transition"
                >
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search scoping docs…"
            className="w-full pl-11 pr-4 py-3 bg-[#111827] border border-[#2a3a55] rounded-lg text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : fetchError ? (
          <div className="text-center py-20 text-[#64748b]">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2 text-red-400">{fetchError}</p>
            <button onClick={fetchScopes} className="text-sm text-blue-400 hover:text-blue-300">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[#64748b]">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">{search ? "No matching documents" : "No scoping documents yet"}</p>
            <p className="text-sm">Click &ldquo;New Scoping Doc&rdquo; to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(scope => (
              <div
                key={scope.id}
                className="group bg-[#1a2234] border border-[#2a3a55] rounded-xl p-5 hover:border-blue-500/40 hover:bg-[#1e2840] transition-all cursor-pointer relative"
                onClick={() => router.push(`/scopes/${scope.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white truncate">{scope.fleet_name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-[#64748b]">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] uppercase tracking-wider font-semibold ${statusColors[scope.status]}`}>
                          {scope.status}
                        </span>
                        <span className={`font-medium ${roleColors[scope.role]}`}>
                          {scope.role}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(scope.updated_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {scope.owner_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {scope.share_access !== "disabled" && scope.share_token && (
                      <span className="text-xs text-cyan-400 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Shared
                      </span>
                    )}
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setMenuOpen(menuOpen === scope.id ? null : scope.id)}
                        className="p-2 hover:bg-white/5 rounded-lg transition"
                      >
                        <MoreVertical className="w-4 h-4 text-[#64748b]" />
                      </button>
                      {menuOpen === scope.id && (
                        <div className="absolute right-0 top-full mt-1 bg-[#1a2234] border border-[#2a3a55] rounded-lg shadow-xl py-1 z-10 min-w-[160px]">
                          <button onClick={() => handleClone(scope.id)} className="w-full px-4 py-2 text-left text-sm text-[#94a3b8] hover:text-white hover:bg-white/5 flex items-center gap-2">
                            <Copy className="w-3.5 h-3.5" /> Clone
                          </button>
                          {scope.role === "owner" && (
                            <button onClick={() => handleDelete(scope.id)} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 flex items-center gap-2">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#2a3a55] group-hover:text-blue-400 transition" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
