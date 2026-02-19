"use client";
import { LinkedField } from "./CrossTabBanner";

export default function SolutionLinkedSection({ data }) {
  const ov = data.overview || {};

  const integrations = [
    ["Incumbent Telematics Provider", ov.current_tsp],
    ["TMS", ov.current_tms],
    ["Document Capture", ov.scanning],
    ["Trailer Tracking", ov.trailer_tracking],
    ["Trailer Temperature Tracking", ov.trailer_temp],
    ["Freight Visibility", ov.freight_visibility],
    ["Camera", ov.video_camera],
    ["In Cab Safety System", ov.incab_safety],
    ["In Cab Coaching", ov.incab_coaching],
    ["Driver Training", ov.training_tech],
    ["In Cab Navigation", ov.incab_navigation],
    ["Route Compliance", ov.route_compliance],
    ["Fleet Maintenance", ov.maintenance],
    ["Tire Pressure Monitoring", ov.tpms],
    ["Hours of Service (HOS)", null],
    ["Compliance Monitoring", ov.compliance],
    ["Fuel Tax", ov.fuel_tax],
    ["Fuel Card Provider", ov.fuel_cards],
    ["Payroll", ov.payroll],
    ["Fuel Optimization", ov.fuel_optimization],
    ["Weigh Station Bypass", ov.weigh_station],
    ["Speed Control (eSmart)", ov.speed_control],
    ["Lane Departure", ov.lane_departure],
    ["Mobile Device Management", ov.mdm],
    ["In Cab Wellness", ov.incab_wellness],
    ["Driver Companion App", ov.driver_companion],
    ["Speeding (Against Posted)", ov.speeding_posted],
  ];

  return (
    <div className="space-y-6 mt-8">
      <div className="flex gap-4">
        <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Account Temperature</div>
          <div className={`text-sm font-semibold ${ov.account_temperature === "Excellent" ? "text-emerald-400" : ov.account_temperature === "Good" ? "text-blue-400" : ov.account_temperature === "Neutral" ? "text-amber-400" : ov.account_temperature === "Poor" ? "text-red-400" : "text-[var(--text-secondary)]"}`}>
            {ov.account_temperature || "—"}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">Set in Overview tab</div>
        </div>
        <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Workflow Future?</div>
          <div className={`text-sm font-semibold ${ov.workflow_future === "Yes" ? "text-emerald-400" : "text-[var(--text-secondary)]"}`}>
            {ov.workflow_future || "No"}
            {ov.workflow_future === "Yes" && <span className="text-[10px] text-emerald-400/60 ml-2">Workflow features shown</span>}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">Set in Overview tab</div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">3rd Party Integrations</h3>
        <p className="text-[10px] text-[var(--text-muted)] mb-4">Read-only view of technology selections from the Overview tab</p>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-blue-500/20/50">
              <th className="text-left px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold">Technology</th>
              <th className="text-left px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold">Which Solution?</th>
            </tr></thead>
            <tbody>
              {integrations.map(([label, value]) => (
                <tr key={label} className="border-t border-[var(--border)]/50 hover:bg-[var(--bg-card)]">
                  <td className="px-4 py-2 text-[var(--text)]">{label}</td>
                  <td className="px-4 py-2 text-[var(--text-secondary)]">{value || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
          Customer Built App Integrations
        </h3>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-blue-500/20/50">
              <th className="text-left px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold">Name</th>
              <th className="text-left px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold">Use Case</th>
              <th className="text-left px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold">Type</th>
              <th className="text-left px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold">URL</th>
            </tr></thead>
            <tbody>
              {(!data.upas || data.upas.length === 0) ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-[var(--text-muted)] text-sm">No custom apps added yet — add them in the Marketplace & UPAs tab</td></tr>
              ) : data.upas.map(u => (
                <tr key={u.id} className="border-t border-[var(--border)]/50 hover:bg-[var(--bg-card)]">
                  <td className="px-4 py-2 text-[var(--text)] font-medium">{u.name}</td>
                  <td className="px-4 py-2 text-[var(--text-secondary)]">{u.use_case || "—"}</td>
                  <td className="px-4 py-2 text-[var(--text-secondary)]">{u.apk_or_website || "—"}</td>
                  <td className="px-4 py-2 text-cyan-400 text-xs font-mono">{u.website_url || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
