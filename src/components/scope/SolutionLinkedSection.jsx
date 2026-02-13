"use client";
import { CrossTabBanner, LinkedField } from "./CrossTabBanner";

// The bottom section of Solution Mix that pulls 3rd party integrations from Overview
// and UPA data from Marketplace tab (rows 29-67 in original sheet)
export default function SolutionLinkedSection({ data }) {
  const ov = data.overview || {};

  const integrations = [
    ["Incumbent Telematics Provider", ov.current_tsp, "Overview!B30"],
    ["TMS", ov.current_tms, "Overview!B31"],
    ["Document Capture", ov.scanning, "Overview!D42"],
    ["Trailer Tracking", ov.trailer_tracking, "Overview!D39"],
    ["Trailer Temperature Tracking", ov.trailer_temp, "Overview!D41"],
    ["Freight Visibility", ov.freight_visibility, "Overview!F39"],
    ["Camera", ov.video_camera, "Overview!F41"],
    ["In Cab Safety System", ov.incab_safety, "Overview!F42"],
    ["In Cab Coaching", ov.incab_coaching, "Overview!F43"],
    ["Driver Training", ov.training_tech, "Overview!F44"],
    ["In Cab Navigation", ov.incab_navigation, "Overview!B40"],
    ["Route Compliance", ov.route_compliance, "Overview!H42"],
    ["Fleet Maintenance", ov.maintenance, "Overview!D44"],
    ["Tire Pressure Monitoring", ov.tpms, "Overview!B39"],
    ["HOS", null, null],
    ["Compliance Monitoring", ov.compliance, "Overview!F45"],
    ["Fuel Tax", ov.fuel_tax, "Overview!B43"],
    ["Fuel Card Provider", ov.fuel_cards, "Overview!B45"],
    ["Payroll", ov.payroll, "Overview!D45"],
    ["Fuel Optimization", ov.fuel_optimization, "Overview!H44"],
    ["Weigh Station Bypass", ov.weigh_station, "Overview!H39"],
    ["Speed Control (eSmart)", ov.speed_control, "Overview!H45"],
    ["Lane Departure", ov.lane_departure, "Overview!B46"],
    ["MDM", ov.mdm, "Overview!H43"],
    ["In Cab Wellness", ov.incab_wellness, "Overview!H46"],
    ["Driver Companion App", ov.driver_companion, "Overview!B44"],
    ["Speeding (Against Posted)", ov.speeding_posted, "Overview!H45"],
  ];

  return (
    <div className="space-y-6 mt-8">
      {/* Solution Mix!O1 = account temperature, B6 = workflow future flag */}
      <div className="flex gap-4">
        <div className="flex-1 bg-[#111827] border border-[#2a3a55] rounded-xl p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1">Account Temperature</div>
          <div className={`text-sm font-semibold ${ov.account_temperature === "Excellent" ? "text-emerald-400" : ov.account_temperature === "Good" ? "text-blue-400" : ov.account_temperature === "Neutral" ? "text-amber-400" : ov.account_temperature === "Poor" ? "text-red-400" : "text-[#94a3b8]"}`}>
            {ov.account_temperature || "—"}
          </div>
          <div className="text-[10px] text-cyan-400/60 font-mono mt-1">← Overview!B25 (Solution Mix!O1)</div>
        </div>
        <div className="flex-1 bg-[#111827] border border-[#2a3a55] rounded-xl p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1">Workflow Future?</div>
          <div className={`text-sm font-semibold ${ov.workflow_future === "Yes" ? "text-emerald-400" : "text-[#94a3b8]"}`}>
            {ov.workflow_future || "No"}
            {ov.workflow_future === "Yes" && <span className="text-[10px] text-emerald-400/60 ml-2">→ Workflow features shown</span>}
          </div>
          <div className="text-[10px] text-cyan-400/60 font-mono mt-1">{'← IF(Overview!D34="Yes", TRUE, FALSE) (Solution Mix!B6)'}</div>
        </div>
      </div>

      {/* 3rd Party Integrations — linked from Overview */}
      <div>
        <CrossTabBanner links={[
          {field: "3rd Party Integration rows", source: "Overview!B30:H46"},
          {field: "UPA data", source: "Marketplace & UPAs!A3:E12"},
        ]}/>
        <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">3rd Party Integrations</h3>
        <div className="bg-[#111827] border border-[#2a3a55] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#1e3a5f]/50">
              <th className="text-left px-4 py-3 text-xs text-[#94a3b8] font-semibold">Technology</th>
              <th className="text-left px-4 py-3 text-xs text-[#94a3b8] font-semibold">Which Solution?</th>
              <th className="text-left px-4 py-3 text-xs text-[#94a3b8] font-semibold w-32">Source</th>
            </tr></thead>
            <tbody>
              {integrations.map(([label, value, src]) => (
                <tr key={label} className="border-t border-[#2a3a55]/50 hover:bg-[#1a2234]">
                  <td className="px-4 py-2 text-white">{label}</td>
                  <td className="px-4 py-2 text-[#94a3b8]">{value || "—"}</td>
                  <td className="px-4 py-2">{src && <span className="text-[10px] text-cyan-400/60 font-mono">← {src}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* UPA summary — linked from Marketplace & UPAs tab */}
      <div>
        <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">
          Customer Built App Integration Call Outs
          <span className="text-[10px] text-cyan-400/60 font-mono ml-2">← Marketplace & UPAs tab</span>
        </h3>
        <div className="bg-[#111827] border border-[#2a3a55] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#1e3a5f]/50">
              <th className="text-left px-4 py-3 text-xs text-[#94a3b8] font-semibold">Name</th>
              <th className="text-left px-4 py-3 text-xs text-[#94a3b8] font-semibold">Use Case</th>
              <th className="text-left px-4 py-3 text-xs text-[#94a3b8] font-semibold">Type</th>
              <th className="text-left px-4 py-3 text-xs text-[#94a3b8] font-semibold">URL</th>
            </tr></thead>
            <tbody>
              {(!data.upas || data.upas.length === 0) ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-[#4a5568] text-sm">No UPAs — add them in the Marketplace & UPAs tab</td></tr>
              ) : data.upas.map(u => (
                <tr key={u.id} className="border-t border-[#2a3a55]/50 hover:bg-[#1a2234]">
                  <td className="px-4 py-2 text-white font-medium">{u.name}</td>
                  <td className="px-4 py-2 text-[#94a3b8]">{u.use_case || "—"}</td>
                  <td className="px-4 py-2 text-[#94a3b8]">{u.apk_or_website || "—"}</td>
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
