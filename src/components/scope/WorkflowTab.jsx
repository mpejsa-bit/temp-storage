"use client";
import { useState } from "react";
import { CrossTabBanner, LinkedField } from "./CrossTabBanner";
import { Pencil, Save, X } from "lucide-react";

export default function WorkflowTab({ data, canEdit, onSave }) {
  const ov = data.overview || {};
  const wt = data.workflow_technical || {};
  const [editing, setEditing] = useState(false);
  const [techFields, setTechFields] = useState({});

  const startEditing = () => {
    setTechFields({
      pse_hostname_prod: wt.pse_hostname_prod || "",
      pse_hostname_dev: wt.pse_hostname_dev || "",
      pse_db_name_prod: wt.pse_db_name_prod || "",
      pse_db_name_dev: wt.pse_db_name_dev || "",
      pse_access_level_prod: wt.pse_access_level_prod || "",
      pse_access_level_dev: wt.pse_access_level_dev || "",
      pse_totalmail_tz: wt.pse_totalmail_tz || ov.fleet_timezone || "",
      pse_tm_ip: wt.pse_tm_ip || "",
      pse_tm_username: wt.pse_tm_username || "",
      pse_tm_password: wt.pse_tm_password || "",
      pse_tms_name: wt.pse_tms_name || ov.current_tms || "",
      tms_access_level: wt.tms_access_level || "",
      tms_ip_address: wt.tms_ip_address || "",
      tms_username: wt.tms_username || "",
      tms_password: wt.tms_password || "",
      tms_telematics_provided: wt.tms_telematics_provided || ov.current_tsp || "",
      tms_portal_url: wt.tms_portal_url || "",
      tms_portal_username: wt.tms_portal_username || "",
      tms_portal_password: wt.tms_portal_password || "",
      psplus_cid_prod: wt.psplus_cid_prod || "",
      psplus_cid_test: wt.psplus_cid_test || "",
      psplus_cid_dev: wt.psplus_cid_dev || "",
      psplus_ip_whitelist: wt.psplus_ip_whitelist || "",
      psplus_integration_username: wt.psplus_integration_username || "",
      psplus_integration_pw: wt.psplus_integration_pw || "",
      psplus_enterprise_id: wt.psplus_enterprise_id || "",
    });
    setEditing(true);
  };

  const saveTech = () => {
    onSave("workflow_technical", techFields);
    setEditing(false);
  };

  const updateField = (key, val) => setTechFields((prev) => ({ ...prev, [key]: val }));

  const TechInput = ({ label, field, type = "text" }) => (
    <div className="flex items-center justify-between py-1.5 border-b border-[var(--border)]/20">
      <span className="text-[var(--text-muted)] text-xs">{label}</span>
      {editing ? (
        <input
          type={type}
          value={techFields[field] || ""}
          onChange={(e) => updateField(field, e.target.value)}
          className="bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-0.5 text-xs text-[var(--text)] font-mono w-48 focus:border-blue-500 focus:outline-none"
          placeholder="—"
        />
      ) : (
        <span className="text-[var(--text)] font-mono text-xs">
          {type === "password" && wt[field] ? "••••••••" : wt[field] || "—"}
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <CrossTabBanner links={[
        {field:"Fleet Name",source:"Overview!B2"},{field:"Drivers",source:"Overview!B10"},{field:"Tractors",source:"Overview!B11"},
        {field:"Trailers",source:"Overview!B12"},{field:"Company Type",source:"Overview!B13"},{field:"Operations",source:"Overview!B14"},
        {field:"TSP Current",source:"Overview!B30"},{field:"TSP Future",source:"Overview!D30"},{field:"TMS Current",source:"Overview!B31"},
        {field:"TMS Future",source:"Overview!D31"},{field:"TMS Type",source:"Overview!B32"},{field:"Workflow",source:"Overview!D34"},
        {field:"Integrator",source:"Overview!D35"},{field:"Sys Integrator",source:"Overview!D36"},{field:"Hardware",source:"Overview!D37"},
        {field:"Form Counts",source:"Stats!B6:B12"},
      ]}/>

      <div className="grid grid-cols-2 gap-6">
        {/* Left column: Fleet Info */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-4">Fleet Information</h3>
          <LinkedField label="Fleet Name" value={data.fleet_name} sourceTab="Overview!B2"/>
          <LinkedField label="Number of Drivers" value={ov.num_drivers} sourceTab="Overview!B10"/>
          <LinkedField label="Number of Tractors" value={ov.num_tractors} sourceTab="Overview!B11"/>
          <LinkedField label="Number of Trailers" value={ov.num_trailers} sourceTab="Overview!B12"/>
          <LinkedField label="Type of Company" value={ov.type_of_company} sourceTab="Overview!B13"/>
          <LinkedField label="Type of Operation(s)" value={ov.type_of_operation} sourceTab="Overview!B14"/>
          <LinkedField label="Operating Companies" value={ov.operating_companies} sourceTab="Overview!B15"/>
          <LinkedField label="Offices/Terminals" value={ov.offices_terminals} sourceTab="Overview!B16"/>
          <LinkedField label="Border Crossing" value={ov.border_crossing} sourceTab="Overview!B17"/>
        </div>

        {/* Right column: TMS & Telematics */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-4">TMS & Telematics</h3>
          <div className="grid grid-cols-2 gap-x-4">
            <div>
              <p className="text-[10px] text-amber-400 font-semibold mb-2 uppercase">Current</p>
              <LinkedField label="Telematics Provider" value={ov.current_tsp} sourceTab="Overview!B30"/>
              <LinkedField label="TMS" value={ov.current_tms} sourceTab="Overview!B31"/>
              <LinkedField label="TMS Type" value={ov.current_tms_type} sourceTab="Overview!B32"/>
              <LinkedField label="TMS Version" value={ov.current_tms_version} sourceTab="Overview!B33"/>
              <LinkedField label="Using Workflow" value={ov.workflow_current||"No"} sourceTab="Overview!B34"/>
              <LinkedField label="Workflow Integrator" value={ov.workflow_integrator_current} sourceTab="Overview!B35"/>
              <LinkedField label="Systems Integrator" value={ov.systems_integrator_current} sourceTab="Overview!B36"/>
            </div>
            <div>
              <p className="text-[10px] text-emerald-400 font-semibold mb-2 uppercase">Future</p>
              <LinkedField label="Telematics Platform" value={ov.ps_platform} sourceTab="Overview!D30"/>
              <LinkedField label="TMS" value={ov.future_tms} sourceTab="Overview!D31"/>
              <LinkedField label="TMS Type" value={ov.future_tms_type} sourceTab="Overview!D32"/>
              <LinkedField label="TMS Version" value={ov.future_tms_version} sourceTab="Overview!D33"/>
              <LinkedField label="Using Workflow" value={ov.workflow_future||"Yes"} sourceTab="Overview!D34"/>
              <LinkedField label="Workflow Integrator" value={ov.workflow_integrator_future} sourceTab="Overview!D35"/>
              <LinkedField label="Systems Integrator" value={ov.systems_integrator_future} sourceTab="Overview!D36"/>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--border)]/30">
            <LinkedField label="Other Hardware Used" value={ov.other_hardware_used} sourceTab="Overview!B37"/>
            <LinkedField label="Other Hardware Needed" value={ov.other_hardware_needed} sourceTab="Overview!D37"/>
          </div>
        </div>
      </div>

      {/* Other Technology Grid */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-4">Other Technology Applications</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            ["TPMS",ov.tpms,"Overview!B39"],["Trailer Tracking",ov.trailer_tracking,"Overview!C39"],["Freight Visibility",ov.freight_visibility,"Overview!E39"],["Lane Departure",ov.lane_departure,"Overview!G39"],
            ["In-Cab Navigation",ov.incab_navigation,"Overview!B40"],["Trailer Tracking TMS",ov.trailer_tracking_tms,"Overview!D40"],["Video Safety",ov.video_safety,"Overview!E40"],["Load Optimization",ov.load_optimization,"Overview!G40"],
            ["LMS",ov.lms,"Overview!B41"],["Trailer Temp Tracking",ov.trailer_temp,"Overview!C41"],["Video/Camera",ov.video_camera,"Overview!E41"],["Quotes",ov.quotes,"Overview!G41"],
            ["Fuel Management",ov.fuel_management,"Overview!B42"],["Scanning",ov.scanning,"Overview!C42"],["In-Cab Safety",ov.incab_safety,"Overview!E42"],["Route Compliance",ov.route_compliance,"Overview!G42"],
            ["Fuel Tax",ov.fuel_tax,"Overview!B43"],["Truck Stop",ov.truck_stop,"Overview!C43"],["In-Cab Coaching",ov.incab_coaching,"Overview!E43"],["MDM",ov.mdm,"Overview!G43"],
            ["Fuel Optimization",ov.fuel_optimization,"Overview!B44"],["Maintenance",ov.maintenance,"Overview!C44"],["Training",ov.training_tech,"Overview!E44"],["Speed Control",ov.speed_control,"Overview!G44"],
            ["Fuel Cards",ov.fuel_cards,"Overview!B45"],["Weigh Station Bypass",ov.weigh_station,"Overview!C45"],["Compliance",ov.compliance,"Overview!E45"],["Speeding (Posted)",ov.speeding_posted,"Overview!G45"],
            ["Driver Companion App",ov.driver_companion,"Overview!B46"],["Scales",ov.scales,"Overview!C46"],["Payroll",ov.payroll,"Overview!E46"],["In-Cab Wellness",ov.incab_wellness,"Overview!G46"],
          ].map(([label,value,src])=>(
            <LinkedField key={label} label={label} value={value} sourceTab={src}/>
          ))}
        </div>
      </div>

      {/* Form category counts */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-4">Form Category Breakdown</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            ["All Forms", data.stats?.forms || 0],
            ["Fleet Type", data.stats?.form_categories?.["Fleet Type"] || 0],
            ["Customer/Consignee", data.stats?.form_categories?.["Customer/Consignee"] || 0],
            ["Shipper", data.stats?.form_categories?.["Shipper"] || 0],
            ["Terminal", data.stats?.form_categories?.["Terminal"] || 0],
            ["Border Crossing", data.stats?.form_categories?.["Border Crossing"] || 0],
          ].map(([label, count]) => (
            <div key={label} className="flex justify-between py-1.5 border-b border-[var(--border)]/30">
              <span className="text-[var(--text-muted)] text-sm">{label}</span>
              <span className="text-[var(--text)] font-medium text-sm">{count}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-cyan-400/60 font-mono mt-2">← Stats!B6:B12 (COUNTIF from Forms tab)</p>
      </div>

      {/* Technical Info — Editable */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider">PS Enterprise Workflow Requirements</h3>
          {canEdit && !editing && (
            <button onClick={startEditing} className="flex items-center gap-1.5 px-3 py-1 text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors">
              <Pencil size={12}/> Edit Technical
            </button>
          )}
          {editing && (
            <div className="flex gap-2">
              <button onClick={saveTech} className="flex items-center gap-1.5 px-3 py-1 text-xs bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-600/30 transition-colors">
                <Save size={12}/> Save
              </button>
              <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-3 py-1 text-xs bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[#1e2840] transition-colors">
                <X size={12}/> Cancel
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-8 text-xs mb-6">
          <div className="font-semibold text-[var(--text-secondary)] col-span-2 mb-1">Technical Information</div>
          <TechInput label="Hostname (Prod)" field="pse_hostname_prod"/>
          <TechInput label="Hostname (Dev)" field="pse_hostname_dev"/>
          <TechInput label="Database Name (Prod)" field="pse_db_name_prod"/>
          <TechInput label="Database Name (Dev)" field="pse_db_name_dev"/>
          <TechInput label="Access Level (Prod)" field="pse_access_level_prod"/>
          <TechInput label="Access Level (Dev)" field="pse_access_level_dev"/>
          <TechInput label="Totalmail Server TZ" field="pse_totalmail_tz"/>
          <TechInput label="TM-IP Address" field="pse_tm_ip"/>
          <TechInput label="TM-Username" field="pse_tm_username"/>
          <TechInput label="TM-Password" field="pse_tm_password" type="password"/>
          <TechInput label="TMS Name" field="pse_tms_name"/>

          <div className="font-semibold text-[var(--text-secondary)] col-span-2 mt-3 mb-1">TMS Database</div>
          <TechInput label="Access Level" field="tms_access_level"/>
          <TechInput label="IP Address" field="tms_ip_address"/>
          <TechInput label="Username" field="tms_username"/>
          <TechInput label="Password" field="tms_password" type="password"/>
          <TechInput label="Telematics Provided" field="tms_telematics_provided"/>
          <TechInput label="Portal URL" field="tms_portal_url"/>
          <TechInput label="Portal Username" field="tms_portal_username"/>
          <TechInput label="Portal Password" field="tms_portal_password" type="password"/>
        </div>

        <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-4">PS Plus Workflow Requirements</h3>
        <div className="grid grid-cols-2 gap-x-8 text-xs">
          <TechInput label="CID Prod" field="psplus_cid_prod"/>
          <TechInput label="CID Test" field="psplus_cid_test"/>
          <TechInput label="CID Dev" field="psplus_cid_dev"/>
          <TechInput label="IP Addresses to Whitelist" field="psplus_ip_whitelist"/>
          <TechInput label="Integration Username" field="psplus_integration_username"/>
          <TechInput label="Integration PW" field="psplus_integration_pw" type="password"/>
          <TechInput label="Enterprise ID (MDE)" field="psplus_enterprise_id"/>
        </div>
      </div>
    </div>
  );
}
