"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronRight, ChevronLeft, Save, Loader2, Shield, Users, Settings, Download, Trash2, ArrowRightLeft, ShieldCheck, ShieldOff, X, AlertTriangle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/components/Toast";

/* ── Tab field registry ─────────────────────────────────────────── */

const TAB_FIELDS: Record<string, { key: string; label: string }[]> = {
  overview: [
    { key: "hq_location", label: "HQ Location" },
    { key: "company_website", label: "Company Website" },
    { key: "ps_platform", label: "PS Platform" },
    { key: "fleet_timezone", label: "Fleet Timezone" },
    { key: "current_technology", label: "Current Technology" },
    { key: "fleet_persona", label: "Fleet Persona" },
    { key: "num_drivers", label: "Number of Drivers" },
    { key: "num_tractors", label: "Number of Tractors" },
    { key: "num_trailers", label: "Number of Trailers" },
    { key: "type_of_company", label: "Type of Company" },
    { key: "type_of_operation", label: "Type of Operation" },
    { key: "current_tsp", label: "Current TSP" },
    { key: "current_tms", label: "Current TMS" },
    { key: "account_executive", label: "Account Executive" },
    { key: "executive_sponsor_name", label: "Executive Sponsor Name" },
    { key: "account_temperature", label: "Account Temperature" },
  ],
  contacts: [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "role_title", label: "Role/Title" },
    { key: "title", label: "Job Title" },
  ],
  marketplace: [
    { key: "product_name", label: "Product Name" },
    { key: "partner_account", label: "Partner Account" },
    { key: "solution_type", label: "Solution Type" },
    { key: "partner_category", label: "Partner Category" },
    { key: "stage", label: "Stage" },
  ],
  upas: [
    { key: "name", label: "App Name" },
    { key: "use_case", label: "Use Case" },
    { key: "website_url", label: "Website URL" },
  ],
  solution: [
    { key: "feature_name", label: "Feature Name" },
    { key: "needed", label: "Needed" },
    { key: "num_licenses", label: "Number of Licenses" },
    { key: "notes", label: "Notes" },
  ],
  gaps: [
    { key: "gap_identified", label: "Gap Identified" },
    { key: "use_case", label: "Use Case" },
    { key: "se_use_case_link", label: "SE Use Case Link" },
    { key: "psop_ticket", label: "PSOP Ticket" },
  ],
  workshop: [
    { key: "response", label: "Response" },
    { key: "comments", label: "Comments" },
  ],
  training: [
    { key: "response", label: "Response" },
    { key: "comments", label: "Comments" },
  ],
  forms: [
    { key: "form_name", label: "Form Name" },
    { key: "purpose", label: "Purpose" },
    { key: "form_category", label: "Form Category" },
    { key: "form_fields", label: "Form Fields" },
  ],
  install: [
    { key: "forecasted", label: "Forecasted" },
    { key: "actual", label: "Actual" },
  ],
  workflow: [
    { key: "pse_hostname_prod", label: "PSE Hostname (Prod)" },
    { key: "pse_hostname_dev", label: "PSE Hostname (Dev)" },
    { key: "pse_tms_name", label: "PSE TMS Name" },
    { key: "tms_ip_address", label: "TMS IP Address" },
    { key: "tms_username", label: "TMS Username" },
    { key: "psplus_cid_prod", label: "PS+ CID (Prod)" },
    { key: "psplus_enterprise_id", label: "PS+ Enterprise ID" },
  ],
};

const TAB_LABELS: Record<string, string> = {
  overview: "Overview",
  contacts: "Contacts",
  marketplace: "Marketplace & UPAs",
  upas: "User Provided Apps",
  solution: "Solution Mix",
  gaps: "Gaps",
  workshop: "Workshop",
  training: "Training",
  forms: "Forms",
  install: "Install Strategy",
  workflow: "Workflow Integration",
};

const ROW_BASED_TABS = new Set([
  "contacts",
  "marketplace",
  "upas",
  "solution",
  "gaps",
  "workshop",
  "training",
  "forms",
  "install",
]);

const TAB_ORDER = Object.keys(TAB_FIELDS);

/* ── Types ──────────────────────────────────────────────────────── */

interface TabConfig {
  required_fields: string[];
  min_rows?: number;
}

type ConfigMap = Record<string, TabConfig>;

interface UserRecord {
  id: string;
  name: string;
  email: string;
  is_admin: number;
  created_at: string;
  last_login_at: string | null;
  login_count: number;
}

interface ActivityRecord {
  id: string;
  action: string;
  detail: string | null;
  ip_address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  user_agent: string | null;
  created_at: string;
  user_name: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  login:              { label: "Logged in",           color: "text-green-400 bg-green-500/15" },
  create_scope:       { label: "Created scope",       color: "text-blue-400 bg-blue-500/15" },
  update_scope:       { label: "Updated scope",       color: "text-amber-400 bg-amber-500/15" },
  update_overview:    { label: "Updated overview",    color: "text-amber-400 bg-amber-500/15" },
  update_contacts:    { label: "Updated contacts",    color: "text-amber-400 bg-amber-500/15" },
  update_marketplace: { label: "Updated marketplace", color: "text-amber-400 bg-amber-500/15" },
  update_upas:        { label: "Updated UPAs",        color: "text-amber-400 bg-amber-500/15" },
  update_features:    { label: "Updated features",    color: "text-amber-400 bg-amber-500/15" },
  update_gaps:        { label: "Updated gaps",        color: "text-amber-400 bg-amber-500/15" },
  update_forms:       { label: "Updated forms",       color: "text-amber-400 bg-amber-500/15" },
  update_workshop:    { label: "Updated workshop",    color: "text-amber-400 bg-amber-500/15" },
  update_training:    { label: "Updated training",    color: "text-amber-400 bg-amber-500/15" },
  update_forecasts:   { label: "Updated forecasts",   color: "text-amber-400 bg-amber-500/15" },
  update_workflow:    { label: "Updated workflow",     color: "text-amber-400 bg-amber-500/15" },
  update_workflow_technical: { label: "Updated tech config", color: "text-amber-400 bg-amber-500/15" },
  delete_scope:       { label: "Deleted scope",       color: "text-red-400 bg-red-500/15" },
  delete_contacts:    { label: "Deleted contact",     color: "text-red-400 bg-red-500/15" },
  delete_marketplace: { label: "Deleted marketplace app", color: "text-red-400 bg-red-500/15" },
  delete_upas:        { label: "Deleted UPA",         color: "text-red-400 bg-red-500/15" },
  delete_gaps:        { label: "Deleted gap",         color: "text-red-400 bg-red-500/15" },
  delete_forms:       { label: "Deleted form",        color: "text-red-400 bg-red-500/15" },
  delete_workshop:    { label: "Deleted workshop Q",  color: "text-red-400 bg-red-500/15" },
  delete_training:    { label: "Deleted training Q",  color: "text-red-400 bg-red-500/15" },
  clone_scope:        { label: "Cloned scope",        color: "text-purple-400 bg-purple-500/15" },
  enable_sharing:     { label: "Enabled sharing",     color: "text-cyan-400 bg-cyan-500/15" },
  disable_sharing:    { label: "Disabled sharing",    color: "text-cyan-400 bg-cyan-500/15" },
  add_collaborator:   { label: "Added collaborator",  color: "text-cyan-400 bg-cyan-500/15" },
  remove_collaborator:{ label: "Removed collaborator", color: "text-cyan-400 bg-cyan-500/15" },
};

/* ── User agent parser ────────────────────────────────────────── */

function shortUA(ua: string | null): string {
  if (!ua || ua === "unknown") return "—";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Safari/") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("MSIE") || ua.includes("Trident")) return "IE";
  return ua.substring(0, 20);
}

function formatLocation(city: string | null, region: string | null): string {
  if (city && region) return `${city}, ${region}`;
  if (city) return city;
  if (region) return region;
  return "—";
}

/* ── Relative time helper ────────────────────────────────────────── */

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const now = Date.now();
  const then = new Date(dateStr + (dateStr.endsWith("Z") ? "" : "Z")).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + (dateStr.endsWith("Z") ? "" : "Z"));
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ── Page component ─────────────────────────────────────────────── */

export default function AdminSettingsPage() {
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [config, setConfig] = useState<ConfigMap>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [expandedTabs, setExpandedTabs] = useState<Set<string>>(new Set());
  const [savingTab, setSavingTab] = useState<string | null>(null);

  // Page-level tab: "completion" or "activity"
  const [activeSection, setActiveSection] = useState<"completion" | "activity">("completion");

  // User activity state
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [activity, setActivity] = useState<ActivityRecord[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const ACTIVITY_LIMIT = 50;

  // Clear activity state
  const [clearFrom, setClearFrom] = useState("");
  const [clearTo, setClearTo] = useState("");
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearResult, setClearResult] = useState<{ deleted: number } | null>(null);

  // User management state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [togglingAdmin, setTogglingAdmin] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [transferModal, setTransferModal] = useState<{ userId: string; userName: string } | null>(null);
  const [userScopes, setUserScopes] = useState<{ id: string; fleet_name: string }[]>([]);
  const [transferringScope, setTransferringScope] = useState<string | null>(null);
  const [transferTargetId, setTransferTargetId] = useState<string>("");

  /* ── Check admin status ──────────────────────────────────────── */

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/admin/check");
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(data.is_admin === true);
          if (data.is_admin) fetchConfig();
          else setLoading(false);
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      } catch {
        setIsAdmin(false);
        setLoading(false);
      }
    }
    checkAdmin();
  }, []);

  async function fetchConfig() {
    try {
      setFetchError("");
      const res = await fetch("/api/admin/completion-config", { cache: "no-store" });
      if (!res.ok) {
        setFetchError(`Failed to load configuration (${res.status})`);
        setLoading(false);
        return;
      }
      const data = await res.json();
      // API returns array of { tab_key, config } or object keyed by tab_key
      const map: ConfigMap = {};
      if (Array.isArray(data)) {
        for (const item of data) {
          map[item.tab_key] = item.config ?? { required_fields: [] };
        }
      } else if (data && typeof data === "object") {
        for (const [key, val] of Object.entries(data)) {
          map[key] = (val as TabConfig) ?? { required_fields: [] };
        }
      }
      setConfig(map);
    } catch {
      setFetchError("Network error loading configuration");
    }
    setLoading(false);
  }

  /* ── Fetch user activity data ──────────────────────────────── */

  const fetchActivity = useCallback(async (page = 1) => {
    setActivityLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ACTIVITY_LIMIT),
      });
      const [usersRes, activityRes] = await Promise.all([
        fetch("/api/admin/users", { cache: "no-store" }),
        fetch(`/api/admin/activity?${params}`, { cache: "no-store" }),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (activityRes.ok) {
        const json = await activityRes.json();
        // Support both old array format and new paginated format
        if (Array.isArray(json)) {
          setActivity(json);
          setActivityTotal(json.length);
          setActivityTotalPages(1);
        } else {
          setActivity(json.data ?? []);
          setActivityTotal(json.pagination?.total ?? 0);
          setActivityTotalPages(json.pagination?.totalPages ?? 1);
        }
      }
    } catch {
      // silently fail — tables will show empty
    }
    setActivityLoading(false);
  }, []);

  useEffect(() => {
    if (activeSection === "activity" && isAdmin) {
      fetchActivity(activityPage);
    }
  }, [activeSection, isAdmin, fetchActivity, activityPage]);

  /* ── User management handlers ────────────────────────────────── */

  // Get current user's session ID
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          setCurrentUserId(data?.user?.id || null);
        }
      } catch { /* ignore */ }
    }
    fetchSession();
  }, []);

  async function toggleAdmin(userId: string, currentIsAdmin: number) {
    setTogglingAdmin(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_admin: currentIsAdmin === 1 ? false : true }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, is_admin: currentIsAdmin === 1 ? 0 : 1 } : u
          )
        );
        toast(
          currentIsAdmin === 1 ? "Admin privileges removed" : "Admin privileges granted",
          "success"
        );
      } else {
        const body = await res.json().catch(() => ({}));
        toast(body.error || "Failed to update user", "error");
      }
    } catch {
      toast("Network error updating user", "error");
    }
    setTogglingAdmin(null);
  }

  async function handleDeleteUser(userId: string) {
    setDeletingUser(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        toast("User deleted successfully", "success");
      } else {
        const body = await res.json().catch(() => ({}));
        toast(body.error || "Failed to delete user", "error");
      }
    } catch {
      toast("Network error deleting user", "error");
    }
    setDeletingUser(null);
    setDeleteConfirmId(null);
  }

  async function openTransferModal(userId: string, userName: string) {
    setTransferModal({ userId, userName });
    setUserScopes([]);
    setTransferTargetId("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/scopes`, { cache: "no-store" });
      if (res.ok) {
        const scopes = await res.json();
        setUserScopes(scopes);
      }
    } catch { /* ignore */ }
  }

  async function handleTransferScope(scopeId: string, newOwnerId: string) {
    setTransferringScope(scopeId);
    try {
      const res = await fetch("/api/admin/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope_id: scopeId, new_owner_id: newOwnerId }),
      });
      if (res.ok) {
        setUserScopes((prev) => prev.filter((s) => s.id !== scopeId));
        toast("Scope ownership transferred", "success");
      } else {
        const body = await res.json().catch(() => ({}));
        toast(body.error || "Transfer failed", "error");
      }
    } catch {
      toast("Network error during transfer", "error");
    }
    setTransferringScope(null);
  }

  /* ── Clear activity handler ──────────────────────────────────── */

  async function handleClearActivity() {
    if (!clearFrom || !clearTo) {
      toast("Please select both from and to dates", "error");
      return;
    }
    setClearing(true);
    setClearResult(null);
    try {
      const res = await fetch("/api/admin/activity", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: clearFrom, to: clearTo }),
      });
      if (res.ok) {
        const data = await res.json();
        setClearResult({ deleted: data.deleted });
        toast(`Deleted ${data.deleted} activity log${data.deleted !== 1 ? "s" : ""}`, "success");
        setClearConfirm(false);
        // Refresh the activity list
        setActivityPage(1);
        fetchActivity(1);
      } else {
        const body = await res.json().catch(() => ({}));
        toast(body.error || "Failed to clear activity", "error");
      }
    } catch {
      toast("Network error clearing activity", "error");
    }
    setClearing(false);
  }

  /* ── Helpers ────────────────────────────────────────────────── */

  function getTabConfig(tabKey: string): TabConfig {
    return config[tabKey] ?? { required_fields: [], min_rows: ROW_BASED_TABS.has(tabKey) ? 0 : undefined };
  }

  function toggleExpanded(tabKey: string) {
    setExpandedTabs((prev) => {
      const next = new Set(prev);
      if (next.has(tabKey)) next.delete(tabKey);
      else next.add(tabKey);
      return next;
    });
  }

  function toggleField(tabKey: string, fieldKey: string) {
    setConfig((prev) => {
      const current = prev[tabKey] ?? { required_fields: [] };
      const fields = current.required_fields ?? [];
      const next = fields.includes(fieldKey)
        ? fields.filter((f) => f !== fieldKey)
        : [...fields, fieldKey];
      return { ...prev, [tabKey]: { ...current, required_fields: next } };
    });
  }

  function setMinRows(tabKey: string, value: number) {
    setConfig((prev) => {
      const current = prev[tabKey] ?? { required_fields: [] };
      return { ...prev, [tabKey]: { ...current, min_rows: value } };
    });
  }

  async function saveTab(tabKey: string) {
    setSavingTab(tabKey);
    try {
      const tabConfig = getTabConfig(tabKey);
      const payload: TabConfig = { required_fields: tabConfig.required_fields };
      if (ROW_BASED_TABS.has(tabKey)) {
        payload.min_rows = tabConfig.min_rows ?? 0;
      }
      const res = await fetch("/api/admin/completion-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tab_key: tabKey, config: payload }),
      });
      if (res.ok) {
        toast(`${TAB_LABELS[tabKey]} settings saved`, "success");
      } else {
        const body = await res.json().catch(() => ({}));
        toast(body.error || `Failed to save (${res.status})`, "error");
      }
    } catch {
      toast("Network error saving configuration", "error");
    }
    setSavingTab(null);
  }

  /* ── Auth guard ─────────────────────────────────────────────── */

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-8 max-w-sm text-center">
          <Shield className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">Access Denied</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            You do not have administrator privileges to view this page.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  /* ── Loading / error states ─────────────────────────────────── */

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-8 max-w-sm text-center">
          <p className="text-sm text-red-400 mb-4">{fetchError}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchConfig();
            }}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg-card)] border-b border-[var(--border)] px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <div className="w-px h-5 bg-[var(--border)]" />
            <h1 className="text-lg font-semibold text-[var(--text)]">Admin Settings</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Section tab navigation */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-card)]">
        <div className="max-w-4xl mx-auto px-6 flex gap-0">
          <button
            onClick={() => setActiveSection("completion")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeSection === "completion"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text)]"
            }`}
          >
            <Settings className="w-4 h-4" />
            Completion Settings
          </button>
          <button
            onClick={() => setActiveSection("activity")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeSection === "activity"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text)]"
            }`}
          >
            <Users className="w-4 h-4" />
            User Activity
          </button>
        </div>
      </div>

      {/* Content */}
      {activeSection === "completion" ? (
        <main className="max-w-4xl mx-auto px-6 py-8 space-y-4">
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Configure which fields are required for each tab to be considered complete.
            For row-based tabs, you can also set a minimum number of rows.
          </p>

          {TAB_ORDER.map((tabKey) => {
            const fields = TAB_FIELDS[tabKey];
            const tabConfig = getTabConfig(tabKey);
            const isExpanded = expandedTabs.has(tabKey);
            const requiredCount = (tabConfig.required_fields ?? []).length;
            const isRowBased = ROW_BASED_TABS.has(tabKey);
            const isSaving = savingTab === tabKey;

            return (
              <div
                key={tabKey}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden"
              >
                {/* Accordion header */}
                <button
                  onClick={() => toggleExpanded(tabKey)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                    )}
                    <span className="text-sm font-medium text-[var(--text)]">
                      {TAB_LABELS[tabKey]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {requiredCount > 0 && (
                      <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full font-medium">
                        {requiredCount} required
                      </span>
                    )}
                    {isRowBased && (tabConfig.min_rows ?? 0) > 0 && (
                      <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                        min {tabConfig.min_rows} row{(tabConfig.min_rows ?? 0) !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-[var(--border)] px-5 py-4 space-y-5">
                    {/* Min rows input */}
                    {isRowBased && (
                      <div>
                        <label className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider block mb-2">
                          Minimum rows required
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={tabConfig.min_rows ?? 0}
                          onChange={(e) => setMinRows(tabKey, Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-24 px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}

                    {/* Field toggles */}
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                        Required Fields
                      </h3>
                      <div className="space-y-2">
                        {fields.map((field) => {
                          const isRequired = (tabConfig.required_fields ?? []).includes(field.key);
                          return (
                            <div
                              key={field.key}
                              className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                            >
                              <span className="text-sm text-[var(--text)]">{field.label}</span>
                              <button
                                onClick={() => toggleField(tabKey, field.key)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                  isRequired ? "bg-blue-600" : "bg-[var(--border)]"
                                }`}
                                aria-label={`${isRequired ? "Disable" : "Enable"} ${field.label} as required`}
                              >
                                <span
                                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                                    isRequired ? "translate-x-[18px]" : "translate-x-[3px]"
                                  }`}
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Save button */}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => saveTab(tabKey)}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </main>
      ) : (
        /* ── User Activity section ──────────────────────────────── */
        <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
          {activityLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : (
            <>
              {/* Users table */}
              <section>
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                  Registered Users ({users.length})
                </h2>
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)]">
                          <th className="text-left px-4 py-3 text-[var(--text-secondary)] font-medium">Name</th>
                          <th className="text-left px-4 py-3 text-[var(--text-secondary)] font-medium">Last Login</th>
                          <th className="text-center px-4 py-3 text-[var(--text-secondary)] font-medium">Logins</th>
                          <th className="text-left px-4 py-3 text-[var(--text-secondary)] font-medium">Created</th>
                          <th className="text-center px-4 py-3 text-[var(--text-secondary)] font-medium">Role</th>
                          <th className="text-center px-4 py-3 text-[var(--text-secondary)] font-medium">Manage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">
                              No users found
                            </td>
                          </tr>
                        ) : (
                          users.map((u) => {
                            const isSelf = u.id === currentUserId;
                            return (
                            <tr key={u.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors">
                              <td className="px-4 py-3 text-[var(--text)] font-medium">{u.name}</td>
                              <td className="px-4 py-3 text-[var(--text-secondary)]" title={u.last_login_at || "Never"}>
                                {timeAgo(u.last_login_at)}
                              </td>
                              <td className="px-4 py-3 text-center text-[var(--text-secondary)]">{u.login_count}</td>
                              <td className="px-4 py-3 text-[var(--text-secondary)]">{formatDateTime(u.created_at)}</td>
                              <td className="px-4 py-3 text-center">
                                {u.is_admin === 1 ? (
                                  <span className="inline-flex items-center gap-1 text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full font-medium">
                                    <Shield className="w-3 h-3" />
                                    Admin
                                  </span>
                                ) : (
                                  <span className="text-xs text-[var(--text-muted)]">User</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-1">
                                  {/* Toggle Admin */}
                                  <button
                                    onClick={() => toggleAdmin(u.id, u.is_admin)}
                                    disabled={togglingAdmin === u.id}
                                    title={u.is_admin === 1 ? "Remove admin" : "Make admin"}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      u.is_admin === 1
                                        ? "text-blue-400 hover:bg-blue-500/15"
                                        : "text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
                                    } disabled:opacity-50`}
                                  >
                                    {togglingAdmin === u.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : u.is_admin === 1 ? (
                                      <ShieldOff className="w-4 h-4" />
                                    ) : (
                                      <ShieldCheck className="w-4 h-4" />
                                    )}
                                  </button>

                                  {/* Transfer Scopes */}
                                  <button
                                    onClick={() => openTransferModal(u.id, u.name)}
                                    title="Transfer scopes"
                                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)] transition-colors"
                                  >
                                    <ArrowRightLeft className="w-4 h-4" />
                                  </button>

                                  {/* Delete User */}
                                  {deleteConfirmId === u.id ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleDeleteUser(u.id)}
                                        disabled={deletingUser === u.id}
                                        className="px-2 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded-md disabled:opacity-50"
                                      >
                                        {deletingUser === u.id ? "..." : "Confirm"}
                                      </button>
                                      <button
                                        onClick={() => setDeleteConfirmId(null)}
                                        className="px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)] rounded-md"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setDeleteConfirmId(u.id)}
                                      disabled={isSelf}
                                      title={isSelf ? "Cannot delete yourself" : "Delete user"}
                                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-red-500/15 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Clear Activity by Date Range */}
              <section>
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                  Clear Activity Logs
                </h2>
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Delete activity log entries within a date range. This action cannot be undone.
                  </p>
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">From</label>
                      <input
                        type="date"
                        value={clearFrom}
                        onChange={(e) => { setClearFrom(e.target.value); setClearResult(null); setClearConfirm(false); }}
                        className="px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">To</label>
                      <input
                        type="date"
                        value={clearTo}
                        onChange={(e) => { setClearTo(e.target.value); setClearResult(null); setClearConfirm(false); }}
                        className="px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    {!clearConfirm ? (
                      <button
                        onClick={() => {
                          if (!clearFrom || !clearTo) {
                            toast("Please select both from and to dates", "error");
                            return;
                          }
                          if (clearFrom > clearTo) {
                            toast("From date must be before To date", "error");
                            return;
                          }
                          setClearConfirm(true);
                        }}
                        disabled={!clearFrom || !clearTo}
                        className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear Activity
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                          <AlertTriangle className="w-4 h-4" />
                          Are you sure?
                        </div>
                        <button
                          onClick={handleClearActivity}
                          disabled={clearing}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          {clearing ? "Deleting..." : "Yes, Delete"}
                        </button>
                        <button
                          onClick={() => setClearConfirm(false)}
                          className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  {clearResult && (
                    <div className="mt-3 text-sm text-green-400">
                      Successfully deleted {clearResult.deleted} activity log{clearResult.deleted !== 1 ? "s" : ""}.
                    </div>
                  )}
                </div>
              </section>

              {/* Recent activity log */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Recent Activity ({activityTotal} total)
                  </h2>
                  <a
                    href="/api/admin/activity?format=csv&limit=10000"
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text)] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg hover:border-blue-500/40 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </a>
                </div>
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)]">
                          <th className="text-left px-4 py-3 text-[var(--text-secondary)] font-medium">User</th>
                          <th className="text-left px-4 py-3 text-[var(--text-secondary)] font-medium">Action</th>
                          <th className="text-left px-4 py-3 text-[var(--text-secondary)] font-medium">Location</th>
                          <th className="text-left px-4 py-3 text-[var(--text-secondary)] font-medium">IP</th>
                          <th className="text-left px-4 py-3 text-[var(--text-secondary)] font-medium">Browser</th>
                          <th className="text-left px-4 py-3 text-[var(--text-secondary)] font-medium">When</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activity.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">
                              No activity recorded yet
                            </td>
                          </tr>
                        ) : (
                          activity.map((a) => {
                            const info = ACTION_LABELS[a.action] ?? { label: a.action, color: "text-[var(--text-muted)] bg-[var(--bg-secondary)]" };
                            return (
                              <tr key={a.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors">
                                <td className="px-4 py-3 text-[var(--text)] font-medium whitespace-nowrap">{a.user_name}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${info.color}`}>
                                    {info.label}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                                  {formatLocation(a.city, a.region)}
                                </td>
                                <td className="px-4 py-3 text-[var(--text-muted)] font-mono text-xs" title={a.ip_address || ""}>
                                  {a.ip_address || "—"}
                                </td>
                                <td className="px-4 py-3 text-[var(--text-secondary)]" title={a.user_agent || ""}>
                                  {shortUA(a.user_agent)}
                                </td>
                                <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap" title={a.created_at}>
                                  {timeAgo(a.created_at)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {activityTotalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
                      <span className="text-xs text-[var(--text-muted)]">
                        Page {activityPage} of {activityTotalPages}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                          disabled={activityPage <= 1}
                          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setActivityPage((p) => Math.min(activityTotalPages, p + 1))}
                          disabled={activityPage >= activityTotalPages}
                          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </main>
      )}
      {/* Transfer Scopes Modal */}
      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold text-[var(--text)]">
                Transfer Scopes from {transferModal.userName}
              </h3>
              <button
                onClick={() => setTransferModal(null)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 max-h-96 overflow-y-auto">
              {userScopes.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-8">
                  This user does not own any scopes.
                </p>
              ) : (
                <div className="space-y-3">
                  {userScopes.map((scope) => (
                    <div
                      key={scope.id}
                      className="flex items-center justify-between gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text)] truncate">
                          {scope.fleet_name}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] font-mono">{scope.id.slice(0, 8)}...</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={transferTargetId}
                          onChange={(e) => setTransferTargetId(e.target.value)}
                          className="text-xs px-2 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-blue-500 max-w-[140px]"
                        >
                          <option value="">Select user...</option>
                          {users
                            .filter((u) => u.id !== transferModal.userId)
                            .map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={() => {
                            if (transferTargetId) {
                              handleTransferScope(scope.id, transferTargetId);
                            }
                          }}
                          disabled={!transferTargetId || transferringScope === scope.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        >
                          {transferringScope === scope.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ArrowRightLeft className="w-3 h-3" />
                          )}
                          Transfer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end px-5 py-3 border-t border-[var(--border)]">
              <button
                onClick={() => setTransferModal(null)}
                className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
