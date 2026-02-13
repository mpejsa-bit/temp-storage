"use client";
import { ArrowRight } from "lucide-react";

export function LinkedField({ label, value, sourceTab }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-[#2a3a55]/30 group">
      <span className="text-[#64748b] text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-white font-medium text-sm">{value != null && value !== "" ? value : "—"}</span>
        <span className="text-[10px] text-cyan-400/60 opacity-0 group-hover:opacity-100 transition font-mono flex items-center gap-1">
          <ArrowRight className="w-3 h-3"/>{sourceTab}
        </span>
      </div>
    </div>
  );
}

export function CrossTabBanner({ links }) {
  return (
    <div className="bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border border-cyan-500/15 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"/>
        <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Linked Data</span>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        {links.map((l,i)=>(
          <span key={i} className="text-xs text-[#64748b]">
            <span className="text-cyan-400/70 font-mono">{l.field}</span>
            <span className="mx-1">←</span>
            <span className="text-blue-400/70">{l.source}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function FleetSummary({ data }) {
  const ov = data.overview || {};
  const sponsor = data.contacts?.find(c=>c.contact_type==="fleet"&&(c.role_title||"").toLowerCase().includes("sponsor"));
  const parts = [
    data.fleet_name," is a fleet located in ",ov.hq_location||"—",
    ". Their Executive Sponsor is ",sponsor?.name||"—",", ",sponsor?.title||"—",". ",
    data.fleet_name," is a ",ov.fleet_size_label||"—"," with ",ov.num_tractors ?? "—",
    " tractors. They are currently using ",ov.current_tsp||"—"," as their TSP and ",
    ov.current_tms||"—"," as their TMS in a ",ov.current_tms_type||"—"," environment. ",
    "They will be leveraging Platform Science's ",ov.ps_platform||"—"," platform. ",
    "Workflow usage today is ",ov.workflow_current||"—",", and workflow usage on ",
    ov.ps_platform||"—"," platform will be ",ov.workflow_integrator_future||"—",". ",
    data.fleet_name," will be leveraging ",data.stats?.marketplace_apps||0,
    " PS Marketplace app(s) and ",data.stats?.upas||0," User Provided Application(s)/Website(s)."
  ];
  return (
    <div className="bg-[#111827] border border-[#2a3a55] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Fleet Overview</span>
        <span className="text-[10px] text-cyan-400/60 font-mono">= START HERE!B2</span>
      </div>
      <p className="text-sm text-[#94a3b8] leading-relaxed">{parts.join("")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {["Overview","Contacts","Stats"].map(t=>(
          <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/15 font-mono">← {t}</span>
        ))}
      </div>
    </div>
  );
}
