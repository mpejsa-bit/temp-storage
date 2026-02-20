"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Plus, FileText, Clock, Users, Search, LogOut, MoreVertical,
  Trash2, Copy, ExternalLink, ChevronRight, Layers, ArrowUpDown, Settings,
  Download, ChevronDown, ChevronUp, BarChart3, Activity, AlertTriangle,
  CheckSquare, Square, X, RefreshCw, Filter, Calendar, Columns
} from "lucide-react";
import SalesforceSearchModal from "@/components/scope/SalesforceSearchModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import CompletionBar from "@/components/scope/CompletionBar";
import NotificationBell from "@/components/NotificationBell";

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
  account_temperature?: string;
}

type SortField = "name" | "updated" | "status";
type SortDir = "asc" | "desc";

export default function DashboardPage() {
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Scope | null>(null);
  const [sortField, setSortField] = useState<SortField>("updated");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTemperature, setFilterTemperature] = useState<string>("all");
  const [filterOwner, setFilterOwner] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [completionData, setCompletionData] = useState<Record<string, { overall: number }>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<{ name: string; match: string; sfData: any | null } | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  async function checkAdmin() {
    try {
      const res = await fetch("/api/admin/check", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(!!data.is_admin);
      }
    } catch {}
  }

  async function loadScopes() {
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

  async function loadCompletion() {
    try {
      const res = await fetch("/api/scopes/completion", { cache: "no-store" });
      if (res.ok) {
        setCompletionData(await res.json());
      }
    } catch {}
  }

  async function loadActivity() {
    try {
      const res = await fetch("/api/admin/activity", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setRecentActivity(Array.isArray(data) ? data.slice(0, 5) : []);
      }
    } catch {}
  }

  useEffect(() => { loadScopes(); loadCompletion(); checkAdmin(); loadActivity(); }, []);

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen && !exportOpen && !bulkStatusOpen) return;
    const handler = () => { setMenuOpen(null); setExportOpen(false); setBulkStatusOpen(false); };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [menuOpen, exportOpen, bulkStatusOpen]);

  // Close create modal on Escape
  useEffect(() => {
    if (!showCreate) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setShowCreate(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showCreate]);

  function findSimilarScope(name: string): string | null {
    const lower = name.toLowerCase().trim();
    if (!lower) return null;
    for (const s of scopes) {
      const existing = s.fleet_name.toLowerCase().trim();
      // Check exact match, substring in either direction
      if (existing === lower) return s.fleet_name;
      if (existing.includes(lower) || lower.includes(existing)) return s.fleet_name;
    }
    return null;
  }

  async function handleCreateScope(name: string, sfData: any | null) {
    // Check for duplicate before creating
    const similar = findSimilarScope(name);
    if (similar && !duplicateWarning) {
      setDuplicateWarning({ name, match: similar, sfData });
      return;
    }
    setDuplicateWarning(null);
    setCreating(true);
    const body: any = { fleet_name: name };
    if (sfData) body.sf_data = sfData;
    const res = await fetch("/api/scopes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const { id } = await res.json();
      toast(`Created "${name}"`);
      router.push(`/scopes/${id}`);
    }
    setCreating(false);
  }

  function handleDuplicateConfirm() {
    if (!duplicateWarning) return;
    const { name, sfData } = duplicateWarning;
    // Set duplicateWarning to a truthy value so the check is bypassed, then call create
    setCreating(true);
    setDuplicateWarning(null);
    const body: any = { fleet_name: name };
    if (sfData) body.sf_data = sfData;
    fetch("/api/scopes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (res) => {
      if (res.ok) {
        const { id } = await res.json();
        toast(`Created "${name}"`);
        router.push(`/scopes/${id}`);
      }
      setCreating(false);
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/scopes/${deleteTarget.id}`, { method: "DELETE" });
    setScopes(scopes.filter(s => s.id !== deleteTarget.id));
    setSelectedIds(prev => { const next = new Set(prev); next.delete(deleteTarget.id); return next; });
    toast(`Deleted "${deleteTarget.fleet_name}"`);
    setDeleteTarget(null);
    setMenuOpen(null);
  }

  async function handleClone(id: string) {
    const scope = scopes.find(s => s.id === id);
    const res = await fetch(`/api/scopes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "clone" }),
    });
    if (res.ok) {
      const { id: newId } = await res.json();
      toast(`Cloned "${scope?.fleet_name || "document"}"`);
      router.push(`/scopes/${newId}`);
    }
    setMenuOpen(null);
  }

  // --- Bulk action handlers ---

  async function handleBulkStatusChange(newStatus: string) {
    const ids = Array.from(selectedIds);
    let successCount = 0;
    for (const id of ids) {
      try {
        const res = await fetch(`/api/scopes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section: "scope", data: { status: newStatus } }),
        });
        if (res.ok) successCount++;
      } catch {}
    }
    setScopes(prev => prev.map(s => selectedIds.has(s.id) ? { ...s, status: newStatus } : s));
    toast(`Updated ${successCount} document${successCount !== 1 ? "s" : ""} to "${newStatus}"`);
    setBulkStatusOpen(false);
    setSelectedIds(new Set());
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    let successCount = 0;
    for (const id of ids) {
      try {
        const res = await fetch(`/api/scopes/${id}`, { method: "DELETE" });
        if (res.ok) successCount++;
      } catch {}
    }
    setScopes(prev => prev.filter(s => !selectedIds.has(s.id)));
    toast(`Deleted ${successCount} document${successCount !== 1 ? "s" : ""}`);
    setBulkDeleteConfirm(false);
    setSelectedIds(new Set());
  }

  function handleBulkExport() {
    const selected = scopes.filter(s => selectedIds.has(s.id));
    const headers = ["Fleet Name", "Status", "Owner", "Account Temperature", "Created", "Updated"];
    const rows = selected.map(s => [
      s.fleet_name,
      s.status,
      s.owner_name,
      s.account_temperature || "",
      s.created_at,
      s.updated_at,
    ].map(v => {
      const str = String(v ?? "");
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? '"' + str.replace(/"/g, '""') + '"'
        : str;
    }).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scopes-selected-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${selected.length} document${selected.length !== 1 ? "s" : ""}`);
  }

  function toggleSelectScope(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // --- Filtering (AND logic across all filters) ---
  let filtered = scopes.filter(s =>
    s.fleet_name.toLowerCase().includes(search.toLowerCase()) ||
    s.owner_name?.toLowerCase().includes(search.toLowerCase())
  );
  if (filterStatus !== "all") {
    filtered = filtered.filter(s => s.status === filterStatus);
  }
  if (filterTemperature !== "all") {
    filtered = filtered.filter(s => (s.account_temperature || "").toLowerCase() === filterTemperature.toLowerCase());
  }
  if (filterOwner !== "all") {
    filtered = filtered.filter(s => s.owner_name === filterOwner);
  }
  if (filterDateFrom) {
    const from = new Date(filterDateFrom);
    from.setHours(0, 0, 0, 0);
    filtered = filtered.filter(s => new Date(s.created_at) >= from);
  }
  if (filterDateTo) {
    const to = new Date(filterDateTo);
    to.setHours(23, 59, 59, 999);
    filtered = filtered.filter(s => new Date(s.created_at) <= to);
  }

  // Sorting
  filtered.sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "name": cmp = a.fleet_name.localeCompare(b.fleet_name); break;
      case "updated": cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(); break;
      case "status": cmp = a.status.localeCompare(b.status); break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // Unique owner names for owner filter dropdown
  const uniqueOwners = Array.from(new Set(scopes.map(s => s.owner_name).filter(Boolean))).sort();

  // Count active filters (excluding search and status which are always visible)
  const advancedFilterCount = [
    filterTemperature !== "all",
    filterOwner !== "all",
    !!filterDateFrom,
    !!filterDateTo,
  ].filter(Boolean).length;

  // Select all for currently filtered items
  const allFilteredSelected = filtered.length > 0 && filtered.every(s => selectedIds.has(s.id));
  const someFilteredSelected = filtered.some(s => selectedIds.has(s.id));

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filtered.forEach(s => next.delete(s.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filtered.forEach(s => next.add(s.id));
        return next;
      });
    }
  }

  function clearAllFilters() {
    setFilterStatus("all");
    setFilterTemperature("all");
    setFilterOwner("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setSearch("");
  }

  // Analytics computations
  const statusCounts = scopes.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgCompletion = (() => {
    const vals = Object.values(completionData).map(c => c.overall);
    if (!vals.length) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  })();

  const topOwners = (() => {
    const counts: Record<string, number> = {};
    scopes.forEach(s => {
      if (s.owner_name) counts[s.owner_name] = (counts[s.owner_name] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  })();

  const statusColors: Record<string, string> = {
    draft: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    active: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    complete: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    archived: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };

  const temperatureColors: Record<string, string> = {
    Excellent: "text-emerald-400",
    Good: "text-blue-400",
    Neutral: "text-amber-400",
    Poor: "text-red-400",
  };

  const roleColors: Record<string, string> = {
    owner: "text-blue-400",
    editor: "text-emerald-400",
    viewer: "text-amber-400",
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-blue-400" />
            <span className="font-bold text-lg">Solution Scoping Document</span>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => router.push("/admin/settings")}
                className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition"
              >
                <Settings className="w-4 h-4" />
                Admin
              </button>
            )}
            <NotificationBell />
            <ThemeToggle />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Title + Actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Solutions Documents</h1>
            <p className="text-[var(--text-muted)] text-sm">{scopes.length} document{scopes.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setExportOpen(!exportOpen)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg hover:border-blue-500/40 transition"
              >
                <Download className="w-4 h-4" />
                Export All
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl py-1 z-10 min-w-[160px]">
                  <a
                    href="/api/scopes/export-all"
                    download="scopes-export.json"
                    className="w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)] flex items-center gap-2"
                    onClick={() => setExportOpen(false)}
                  >
                    <FileText className="w-3.5 h-3.5" /> Export JSON
                  </a>
                  <a
                    href="/api/scopes/export-all?format=csv"
                    download="scopes-export.csv"
                    className="w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)] flex items-center gap-2"
                    onClick={() => setExportOpen(false)}
                  >
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </a>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              New Solutions Document
            </button>
          </div>
        </div>

        {/* Create Modal */}
        <SalesforceSearchModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onCreateScope={handleCreateScope}
        />

        {/* Search + Sort + Filter */}
        <div className="flex gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or owner..."
              className="w-full pl-11 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="complete">Complete</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-2 px-3 py-3 bg-[var(--bg-secondary)] border rounded-lg text-sm transition ${
              showAdvancedFilters || advancedFilterCount > 0
                ? "border-blue-500/40 text-blue-400"
                : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {advancedFilterCount > 0 && (
              <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {advancedFilterCount}
              </span>
            )}
          </button>
          <div className="flex bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg overflow-hidden">
            {([["name","Name"],["updated","Updated"],["status","Status"]] as [SortField,string][]).map(([f,l])=>(
              <button key={f} onClick={()=>toggleSort(f)} className={`px-3 py-2 text-xs font-medium transition flex items-center gap-1 ${sortField===f?"text-blue-400 bg-blue-500/10":"text-[var(--text-muted)] hover:text-[var(--text)]"}`}>
                {l}
                {sortField===f && <ArrowUpDown className="w-3 h-3"/>}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4 mb-3 flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">Account Temperature</label>
              <select
                value={filterTemperature}
                onChange={e => setFilterTemperature(e.target.value)}
                className="px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Neutral">Neutral</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">Owner</label>
              <select
                value={filterOwner}
                onChange={e => setFilterOwner(e.target.value)}
                className="px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="all">All owners</option>
                {uniqueOwners.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">Created from</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                className="px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">Created to</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                className="px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            {advancedFilterCount > 0 && (
              <button
                onClick={() => { setFilterTemperature("all"); setFilterOwner("all"); setFilterDateFrom(""); setFilterDateTo(""); }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Active filter pills (shown when advanced panel is closed) */}
        {advancedFilterCount > 0 && !showAdvancedFilters && (
          <div className="flex flex-wrap gap-2 mb-3">
            {filterTemperature !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">
                Temp: {filterTemperature}
                <button onClick={() => setFilterTemperature("all")} className="hover:text-blue-200"><X className="w-3 h-3" /></button>
              </span>
            )}
            {filterOwner !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">
                Owner: {filterOwner}
                <button onClick={() => setFilterOwner("all")} className="hover:text-blue-200"><X className="w-3 h-3" /></button>
              </span>
            )}
            {filterDateFrom && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">
                From: {filterDateFrom}
                <button onClick={() => setFilterDateFrom("")} className="hover:text-blue-200"><X className="w-3 h-3" /></button>
              </span>
            )}
            {filterDateTo && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">
                To: {filterDateTo}
                <button onClick={() => setFilterDateTo("")} className="hover:text-blue-200"><X className="w-3 h-3" /></button>
              </span>
            )}
            <button
              onClick={() => { setFilterTemperature("all"); setFilterOwner("all"); setFilterDateFrom(""); setFilterDateTo(""); }}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition"
            >
              <X className="w-3 h-3" /> Clear all
            </button>
          </div>
        )}

        {/* Analytics Section */}
        {!loading && !fetchError && scopes.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setAnalyticsOpen(!analyticsOpen)}
              className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition mb-3"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics Overview
              {analyticsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {analyticsOpen && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                {/* Scopes by Status */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">By Status</h4>
                  <div className="space-y-2">
                    {(["draft", "active", "complete", "archived"] as const).map(status => {
                      const count = statusCounts[status] || 0;
                      const pct = scopes.length ? Math.round((count / scopes.length) * 100) : 0;
                      const barColors: Record<string, string> = {
                        draft: "bg-amber-400",
                        active: "bg-blue-400",
                        complete: "bg-emerald-400",
                        archived: "bg-gray-400",
                      };
                      return (
                        <div key={status}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="capitalize text-[var(--text-secondary)]">{status}</span>
                            <span className="text-[var(--text-muted)]">{count}</span>
                          </div>
                          <div className="h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColors[status]} transition-all duration-500`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Completion Rate */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Avg Completion</h4>
                  <div className="flex items-center justify-center py-2">
                    <div className="relative w-20 h-20">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="var(--border)"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={avgCompletion >= 75 ? "#34d399" : avgCompletion >= 40 ? "#60a5fa" : "#fbbf24"}
                          strokeWidth="3"
                          strokeDasharray={`${avgCompletion}, 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold">{avgCompletion}%</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] text-center mt-1">
                    across {Object.keys(completionData).length} document{Object.keys(completionData).length !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Most Active Users */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Top Owners</h4>
                  {topOwners.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)]">No data</p>
                  ) : (
                    <div className="space-y-2">
                      {topOwners.map(([name, count], i) => {
                        const maxCount = topOwners[0][1];
                        const pct = maxCount ? Math.round((count / maxCount) * 100) : 0;
                        return (
                          <div key={name}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-[var(--text-secondary)] truncate mr-2">{name}</span>
                              <span className="text-[var(--text-muted)] flex-shrink-0">{count}</span>
                            </div>
                            <div className="h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-400 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Activity className="w-3 h-3" />
                    Recent Activity
                  </h4>
                  {recentActivity.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)]">No recent activity</p>
                  ) : (
                    <div className="space-y-2">
                      {recentActivity.map((a: any, i: number) => (
                        <div key={a.id || i} className="flex items-start gap-2 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[var(--text-secondary)] font-medium">{a.user_name}</span>
                            <span className="text-[var(--text-muted)]"> {a.action}</span>
                            {a.detail && <span className="text-[var(--text-muted)]"> - {a.detail}</span>}
                            <div className="text-[var(--text-muted)] text-[10px]">
                              {a.created_at ? new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Select All Header */}
        {!loading && !fetchError && filtered.length > 0 && (
          <div className="flex items-center gap-3 mb-3 px-1">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition"
            >
              {allFilteredSelected ? (
                <CheckSquare className="w-4 h-4 text-blue-400" />
              ) : someFilteredSelected ? (
                <div className="w-4 h-4 border-2 border-blue-400 rounded flex items-center justify-center bg-blue-500/20">
                  <div className="w-2 h-0.5 bg-blue-400 rounded" />
                </div>
              ) : (
                <Square className="w-4 h-4" />
              )}
              {allFilteredSelected ? "Deselect all" : "Select all"} ({filtered.length})
            </button>
            {selectedIds.size > 0 && (
              <span className="text-xs text-blue-400 font-medium">
                {selectedIds.size} selected
              </span>
            )}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : fetchError ? (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2 text-red-400">{fetchError}</p>
            <button onClick={loadScopes} className="text-sm text-blue-400 hover:text-blue-300">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">{search || filterStatus !== "all" || advancedFilterCount > 0 ? "No matching documents" : "No solutions documents yet"}</p>
            <p className="text-sm">
              {search || filterStatus !== "all" || advancedFilterCount > 0
                ? <button onClick={clearAllFilters} className="text-blue-400 hover:text-blue-300">Clear all filters</button>
                : <>Click &ldquo;New Solutions Document&rdquo; to get started</>
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(scope => {
              const isSelected = selectedIds.has(scope.id);
              return (
                <div
                  key={scope.id}
                  className={`group bg-[var(--bg-card)] border rounded-xl p-5 hover:border-blue-500/40 transition-all cursor-pointer relative ${
                    isSelected ? "border-blue-500/50 bg-blue-500/5" : "border-[var(--border)]"
                  }`}
                  onClick={() => router.push(`/scopes/${scope.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Checkbox */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSelectScope(scope.id); }}
                        className="flex-shrink-0 p-0.5 hover:bg-[var(--bg-secondary)] rounded transition"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-400" />
                        ) : (
                          <Square className="w-5 h-5 text-[var(--border)] group-hover:text-[var(--text-muted)]" />
                        )}
                      </button>
                      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{scope.fleet_name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)] flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] uppercase tracking-wider font-semibold ${statusColors[scope.status]}`}>
                            {scope.status}
                          </span>
                          {scope.account_temperature && (
                            <span className={`font-medium ${temperatureColors[scope.account_temperature] || "text-[var(--text-secondary)]"}`}>
                              {scope.account_temperature}
                            </span>
                          )}
                          <span className={`font-medium ${roleColors[scope.role]}`}>
                            {scope.role}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(scope.updated_at).toLocaleDateString("en-US",{month:"2-digit",day:"2-digit",year:"numeric"})}
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
                          onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === scope.id ? null : scope.id); }}
                          className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition"
                        >
                          <MoreVertical className="w-4 h-4 text-[var(--text-muted)]" />
                        </button>
                        {menuOpen === scope.id && (
                          <div className="absolute right-0 top-full mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl py-1 z-10 min-w-[160px]">
                            <button onClick={() => handleClone(scope.id)} className="w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)] flex items-center gap-2">
                              <Copy className="w-3.5 h-3.5" /> Clone
                            </button>
                            {scope.role === "owner" && (
                              <button onClick={() => { setDeleteTarget(scope); setMenuOpen(null); }} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 flex items-center gap-2">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-[var(--border)] group-hover:text-blue-400 transition" />
                    </div>
                  </div>
                  {completionData[scope.id] !== undefined && (
                    <div className="mt-3 ml-[4.5rem] mr-4">
                      <CompletionBar percent={completionData[scope.id]?.overall ?? 100} size="sm" showLabel />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Bulk Actions Floating Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl px-6 py-3">
            <span className="text-sm font-medium text-[var(--text)]">
              {selectedIds.size} selected
            </span>
            <div className="w-px h-6 bg-[var(--border)]" />

            {/* Change Status */}
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setBulkStatusOpen(!bulkStatusOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg hover:border-blue-500/40 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Change Status
                <ChevronDown className="w-3 h-3" />
              </button>
              {bulkStatusOpen && (
                <div className="absolute bottom-full mb-1 left-0 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl py-1 z-10 min-w-[140px]">
                  {["draft", "active", "complete"].map(st => (
                    <button
                      key={st}
                      onClick={() => handleBulkStatusChange(st)}
                      className="w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)] capitalize flex items-center gap-2"
                    >
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        st === "draft" ? "bg-amber-400" : st === "active" ? "bg-blue-400" : "bg-emerald-400"
                      }`} />
                      {st}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Compare (exactly 2 selected) */}
            {selectedIds.size === 2 && (
              <button
                onClick={() => {
                  const ids = Array.from(selectedIds);
                  router.push(`/compare?left=${ids[0]}&right=${ids[1]}`);
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/5 border border-cyan-500/20 rounded-lg hover:border-cyan-500/40 transition"
              >
                <Columns className="w-3.5 h-3.5" />
                Compare
              </button>
            )}

            {/* Export Selected */}
            <button
              onClick={handleBulkExport}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg hover:border-blue-500/40 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>

            {/* Delete Selected */}
            <button
              onClick={() => setBulkDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 bg-red-500/5 border border-red-500/20 rounded-lg hover:border-red-500/40 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>

            <div className="w-px h-6 bg-[var(--border)]" />

            {/* Clear Selection */}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] transition"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Single delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteTarget?.fleet_name}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Bulk delete confirmation */}
      <ConfirmDialog
        open={bulkDeleteConfirm}
        title="Delete Selected Documents"
        message={`Are you sure you want to delete ${selectedIds.size} document${selectedIds.size !== 1 ? "s" : ""}? This cannot be undone.`}
        confirmLabel={`Delete ${selectedIds.size}`}
        destructive
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteConfirm(false)}
      />

      {/* Duplicate Scope Warning */}
      {duplicateWarning && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setDuplicateWarning(null)}>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold">Similar Scope Found</h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              A scope with a similar name already exists: <span className="font-semibold text-[var(--text)]">&ldquo;{duplicateWarning.match}&rdquo;</span>. Do you want to continue creating <span className="font-semibold text-[var(--text)]">&ldquo;{duplicateWarning.name}&rdquo;</span> anyway?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDuplicateWarning(null)} className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">Cancel</button>
              <button
                onClick={handleDuplicateConfirm}
                className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
