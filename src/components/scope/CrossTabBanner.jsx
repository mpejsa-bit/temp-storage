"use client";

export function LinkedField({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-[var(--border)]/30">
      <span className="text-[var(--text-muted)] text-sm">{label}</span>
      <span className="text-[var(--text)] font-medium text-sm">{value != null && value !== "" ? value : "—"}</span>
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
    " tractors. They are currently using ",ov.current_tsp||"—"," as their Telematics Service Provider and ",
    ov.current_tms||"—"," as their TMS in a ",ov.current_tms_type||"—"," environment. ",
    "They will be leveraging Platform Science's ",ov.ps_platform||"—"," platform. ",
    "Workflow usage today is ",ov.workflow_current||"—",", and workflow usage on ",
    ov.ps_platform||"—"," platform will be ",ov.workflow_integrator_future||"—",". ",
    data.fleet_name," will be leveraging ",data.stats?.marketplace_apps||0,
    " PS Marketplace app(s) and ",data.stats?.upas||0," User Provided Application(s)/Website(s)."
  ];
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Fleet Overview</span>
      </div>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{parts.join("")}</p>
    </div>
  );
}
