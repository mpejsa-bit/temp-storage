"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronRight, Save, Loader2, Shield } from "lucide-react";
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

/* ── Page component ─────────────────────────────────────────────── */

export default function AdminSettingsPage() {
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [config, setConfig] = useState<ConfigMap>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [expandedTabs, setExpandedTabs] = useState<Set<string>>(new Set());
  const [savingTab, setSavingTab] = useState<string | null>(null);

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
            <h1 className="text-lg font-semibold text-[var(--text)]">Completion Settings</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
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
    </div>
  );
}
