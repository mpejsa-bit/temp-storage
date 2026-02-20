"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Building2, Phone, ShoppingBag, Puzzle, AlertTriangle, Calendar, ClipboardList } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface ScopeData {
  id: string;
  fleet_name: string;
  status: string;
  overview: Record<string, any>;
  contacts: any[];
  marketplace_apps: any[];
  upas: any[];
  features: any[];
  gaps: any[];
  forms: any[];
  forecasts: any[];
  stats: {
    marketplace_apps: number;
    upas: number;
    forms: number;
    gaps: number;
    features_needed: number;
  };
}

const OVERVIEW_FIELDS: { key: string; label: string }[] = [
  { key: "fleet_name", label: "Fleet Name" },
  { key: "hq_location", label: "HQ Location" },
  { key: "ps_platform", label: "PS Platform" },
  { key: "fleet_timezone", label: "Fleet Timezone" },
  { key: "current_technology", label: "Current Technology" },
  { key: "fleet_persona", label: "Fleet Persona" },
  { key: "type_of_company", label: "Type of Company" },
  { key: "type_of_operation", label: "Type of Operation" },
  { key: "fleet_size_label", label: "Fleet Size" },
  { key: "num_drivers", label: "# Drivers" },
  { key: "num_tractors", label: "# Tractors" },
  { key: "num_trailers", label: "# Trailers" },
  { key: "current_tsp", label: "Current TSP" },
  { key: "current_tms", label: "Current TMS" },
  { key: "current_tms_type", label: "Current TMS Type" },
  { key: "future_tms", label: "Future TMS" },
  { key: "future_tms_type", label: "Future TMS Type" },
  { key: "account_executive", label: "Account Executive" },
  { key: "date_lead_provided", label: "Date Lead Provided" },
  { key: "has_tankers", label: "Has Tankers" },
  { key: "use_containers", label: "Uses Containers" },
  { key: "use_chassis", label: "Uses Chassis" },
  { key: "parcel_shipments", label: "Parcel Shipments" },
  { key: "multi_stop_orders", label: "Multi-stop Orders" },
  { key: "commodities_hauled", label: "Commodities Hauled" },
];

function CompareRow({ label, left, right }: { label: string; left: string; right: string }) {
  const isDiff = left !== right;
  return (
    <tr className="border-t border-[var(--border)]/30 hover:bg-[var(--bg-card)]">
      <td className="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider w-48">
        {label}
      </td>
      <td className={`px-4 py-2.5 text-sm ${isDiff ? "text-red-400 bg-red-500/5" : "text-[var(--text)]"}`}>
        {left || <span className="text-[var(--text-muted)] italic">--</span>}
      </td>
      <td className={`px-4 py-2.5 text-sm ${isDiff ? "text-emerald-400 bg-emerald-500/5" : "text-[var(--text)]"}`}>
        {right || <span className="text-[var(--text-muted)] italic">--</span>}
      </td>
    </tr>
  );
}

function CountRow({ label, left, right }: { label: string; left: number; right: number }) {
  const isDiff = left !== right;
  return (
    <tr className="border-t border-[var(--border)]/30 hover:bg-[var(--bg-card)]">
      <td className="px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider w-48">
        {label}
      </td>
      <td className={`px-4 py-2.5 text-sm font-bold ${isDiff ? "text-red-400 bg-red-500/5" : "text-[var(--text)]"}`}>
        {left}
      </td>
      <td className={`px-4 py-2.5 text-sm font-bold ${isDiff ? "text-emerald-400 bg-emerald-500/5" : "text-[var(--text)]"}`}>
        {right}
      </td>
    </tr>
  );
}

function ComparePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leftId = searchParams.get("left");
  const rightId = searchParams.get("right");

  const [leftData, setLeftData] = useState<ScopeData | null>(null);
  const [rightData, setRightData] = useState<ScopeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!leftId || !rightId) {
      setError("Two scope IDs are required for comparison");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [lr, rr] = await Promise.all([
          fetch(`/api/scopes/${leftId}`),
          fetch(`/api/scopes/${rightId}`),
        ]);
        if (!lr.ok || !rr.ok) {
          setError("Failed to load one or both scopes");
          setLoading(false);
          return;
        }
        setLeftData(await lr.json());
        setRightData(await rr.json());
      } catch {
        setError("Network error loading scopes");
      }
      setLoading(false);
    }
    load();
  }, [leftId, rightId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !leftData || !rightData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Scopes not found"}</p>
          <button onClick={() => router.push("/dashboard")} className="text-blue-400 text-sm">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const leftOv = leftData.overview || {};
  const rightOv = rightData.overview || {};

  const leftContacts = leftData.contacts || [];
  const rightContacts = rightData.contacts || [];

  // Count differences in overview
  let diffCount = 0;
  for (const f of OVERVIEW_FIELDS) {
    const lv = String(leftOv[f.key] ?? "");
    const rv = String(rightOv[f.key] ?? "");
    if (lv !== rv) diffCount++;
  }

  // Feature comparison: list features by name
  const leftFeatures = (leftData.features || []).filter((f: any) => f.needed);
  const rightFeatures = (rightData.features || []).filter((f: any) => f.needed);
  const leftFeatureNames = new Set(leftFeatures.map((f: any) => f.feature_name));
  const rightFeatureNames = new Set(rightFeatures.map((f: any) => f.feature_name));
  const allFeatureNames = Array.from(new Set([...Array.from(leftFeatureNames), ...Array.from(rightFeatureNames)])).sort();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
            <span className="text-[var(--border)]">/</span>
            <h1 className="font-bold text-lg">Side-by-Side Comparison</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-muted)]">
              {diffCount} difference{diffCount !== 1 ? "s" : ""} found in overview fields
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Scope Headers */}
        <div className="grid grid-cols-[200px_1fr_1fr] gap-0 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="px-4 py-4 border-b border-[var(--border)] bg-[var(--bg)]" />
          <div className="px-4 py-4 border-b border-l border-[var(--border)]">
            <h2 className="font-bold text-lg text-red-400">{leftData.fleet_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-semibold ${
                leftData.status === "active" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                leftData.status === "complete" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                "text-amber-400 bg-amber-500/10 border-amber-500/20"
              }`}>{leftData.status}</span>
              <button onClick={() => router.push(`/scopes/${leftData.id}`)} className="text-xs text-blue-400 hover:text-blue-300">
                Open
              </button>
            </div>
          </div>
          <div className="px-4 py-4 border-b border-l border-[var(--border)]">
            <h2 className="font-bold text-lg text-emerald-400">{rightData.fleet_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-semibold ${
                rightData.status === "active" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                rightData.status === "complete" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                "text-amber-400 bg-amber-500/10 border-amber-500/20"
              }`}>{rightData.status}</span>
              <button onClick={() => router.push(`/scopes/${rightData.id}`)} className="text-xs text-blue-400 hover:text-blue-300">
                Open
              </button>
            </div>
          </div>
        </div>

        {/* Overview Fields */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Overview Fields</h3>
          </div>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-500/10">
                  <th className="text-left px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold w-48">Field</th>
                  <th className="text-left px-4 py-3 text-xs text-red-400 font-semibold">{leftData.fleet_name}</th>
                  <th className="text-left px-4 py-3 text-xs text-emerald-400 font-semibold">{rightData.fleet_name}</th>
                </tr>
              </thead>
              <tbody>
                {OVERVIEW_FIELDS.map((f) => (
                  <CompareRow
                    key={f.key}
                    label={f.label}
                    left={String(leftOv[f.key] ?? "")}
                    right={String(rightOv[f.key] ?? "")}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Counts Comparison */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Data Counts</h3>
          </div>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-500/10">
                  <th className="text-left px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold w-48">Metric</th>
                  <th className="text-left px-4 py-3 text-xs text-red-400 font-semibold">{leftData.fleet_name}</th>
                  <th className="text-left px-4 py-3 text-xs text-emerald-400 font-semibold">{rightData.fleet_name}</th>
                </tr>
              </thead>
              <tbody>
                <CountRow label="PS Team Contacts" left={leftContacts.filter((c: any) => c.contact_type === "ps_team").length} right={rightContacts.filter((c: any) => c.contact_type === "ps_team").length} />
                <CountRow label="Fleet Contacts" left={leftContacts.filter((c: any) => c.contact_type === "fleet").length} right={rightContacts.filter((c: any) => c.contact_type === "fleet").length} />
                <CountRow label="Marketplace Apps" left={leftData.stats.marketplace_apps} right={rightData.stats.marketplace_apps} />
                <CountRow label="User Provided Apps" left={leftData.stats.upas} right={rightData.stats.upas} />
                <CountRow label="Features Needed" left={leftData.stats.features_needed} right={rightData.stats.features_needed} />
                <CountRow label="Gaps" left={leftData.stats.gaps} right={rightData.stats.gaps} />
                <CountRow label="Forms" left={leftData.stats.forms} right={rightData.stats.forms} />
              </tbody>
            </table>
          </div>
        </section>

        {/* Features Needed Comparison */}
        {allFeatureNames.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Puzzle className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Features Needed</h3>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-500/10">
                    <th className="text-left px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold w-48">Feature</th>
                    <th className="text-left px-4 py-3 text-xs text-red-400 font-semibold">{leftData.fleet_name}</th>
                    <th className="text-left px-4 py-3 text-xs text-emerald-400 font-semibold">{rightData.fleet_name}</th>
                  </tr>
                </thead>
                <tbody>
                  {allFeatureNames.map((name) => {
                    const inLeft = leftFeatureNames.has(name);
                    const inRight = rightFeatureNames.has(name);
                    const isDiff = inLeft !== inRight;
                    return (
                      <tr key={name} className="border-t border-[var(--border)]/30 hover:bg-[var(--bg-card)]">
                        <td className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{name}</td>
                        <td className={`px-4 py-2 text-sm ${isDiff && inLeft ? "text-red-400 bg-red-500/5" : isDiff ? "text-[var(--text-muted)]" : "text-[var(--text)]"}`}>
                          {inLeft ? "Needed" : "--"}
                        </td>
                        <td className={`px-4 py-2 text-sm ${isDiff && inRight ? "text-emerald-400 bg-emerald-500/5" : isDiff ? "text-[var(--text-muted)]" : "text-[var(--text)]"}`}>
                          {inRight ? "Needed" : "--"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Marketplace Apps Comparison */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Marketplace Apps</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
              <h4 className="text-xs font-semibold text-red-400 mb-3">{leftData.fleet_name} ({leftData.marketplace_apps.length})</h4>
              {leftData.marketplace_apps.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic">No marketplace apps</p>
              ) : (
                <div className="space-y-1">
                  {leftData.marketplace_apps.map((a: any) => {
                    const inRight = rightData.marketplace_apps.some((r: any) => r.product_name === a.product_name);
                    return (
                      <div key={a.id} className={`text-xs px-2 py-1 rounded ${inRight ? "text-[var(--text)]" : "text-red-400 bg-red-500/5 border border-red-500/10"}`}>
                        {a.product_name}
                        {!inRight && <span className="text-[10px] ml-1 opacity-60">(unique)</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
              <h4 className="text-xs font-semibold text-emerald-400 mb-3">{rightData.fleet_name} ({rightData.marketplace_apps.length})</h4>
              {rightData.marketplace_apps.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic">No marketplace apps</p>
              ) : (
                <div className="space-y-1">
                  {rightData.marketplace_apps.map((a: any) => {
                    const inLeft = leftData.marketplace_apps.some((l: any) => l.product_name === a.product_name);
                    return (
                      <div key={a.id} className={`text-xs px-2 py-1 rounded ${inLeft ? "text-[var(--text)]" : "text-emerald-400 bg-emerald-500/5 border border-emerald-500/10"}`}>
                        {a.product_name}
                        {!inLeft && <span className="text-[10px] ml-1 opacity-60">(unique)</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Gaps Comparison */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Gaps</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
              <h4 className="text-xs font-semibold text-red-400 mb-3">{leftData.fleet_name} ({(leftData.gaps || []).length})</h4>
              {(leftData.gaps || []).length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic">No gaps</p>
              ) : (
                <div className="space-y-2">
                  {(leftData.gaps || []).map((g: any) => (
                    <div key={g.id} className="text-xs bg-amber-500/5 border border-amber-500/10 rounded px-2 py-1.5">
                      <span className="text-amber-400 font-medium">Gap #{g.gap_number}:</span>{" "}
                      <span className="text-[var(--text-secondary)]">{g.gap_identified || "--"}</span>
                      {g.customer_blocker ? <span className="text-red-400 ml-1 text-[10px]">(BLOCKER)</span> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
              <h4 className="text-xs font-semibold text-emerald-400 mb-3">{rightData.fleet_name} ({(rightData.gaps || []).length})</h4>
              {(rightData.gaps || []).length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic">No gaps</p>
              ) : (
                <div className="space-y-2">
                  {(rightData.gaps || []).map((g: any) => (
                    <div key={g.id} className="text-xs bg-amber-500/5 border border-amber-500/10 rounded px-2 py-1.5">
                      <span className="text-amber-400 font-medium">Gap #{g.gap_number}:</span>{" "}
                      <span className="text-[var(--text-secondary)]">{g.gap_identified || "--"}</span>
                      {g.customer_blocker ? <span className="text-red-400 ml-1 text-[10px]">(BLOCKER)</span> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"/></div>}>
      <ComparePageInner />
    </Suspense>
  );
}
