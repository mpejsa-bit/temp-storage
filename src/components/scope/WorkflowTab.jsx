"use client";
import { useState, useEffect, useRef } from "react";
import { LinkedField } from "./CrossTabBanner";
import { Eye, EyeOff, Shield, Plus, Trash2 } from "lucide-react";

function TechInput({ label, field, type, hint, placeholder, canEdit, savedValue, onSave, showPw, onTogglePw }) {
  const [local, setLocal] = useState(savedValue || "");
  const timer = useRef(null);

  // Sync from server only when savedValue genuinely changes AND user isn't typing
  const prevSaved = useRef(savedValue);
  useEffect(() => {
    if (savedValue !== prevSaved.current) {
      prevSaved.current = savedValue;
      if (!timer.current) setLocal(savedValue || "");
    }
  }, [savedValue]);

  const handleChange = (e) => {
    const v = e.target.value;
    setLocal(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      onSave(field, v);
    }, 800);
  };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[var(--border)]/20">
      <div>
        <span className="text-[var(--text-muted)] text-xs">{label}</span>
        {hint && <span className="text-[10px] text-[var(--text-muted)] ml-1">({hint})</span>}
      </div>
      {canEdit ? (
        <div className="relative">
          <input
            type={type === "password" && !showPw ? "password" : "text"}
            value={local}
            onChange={handleChange}
            className="bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-0.5 text-xs text-[var(--text)] font-mono w-48 focus:border-blue-500 focus:outline-none"
            placeholder={placeholder||"—"}
          />
          {type === "password" && (
            <button type="button" onClick={() => onTogglePw(field)} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]">
              {showPw ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
            </button>
          )}
        </div>
      ) : (
        <span className="text-[var(--text)] font-mono text-xs">
          {type === "password" && savedValue ? "••••••••" : savedValue || "—"}
        </span>
      )}
    </div>
  );
}

function CustomTechEntry({ entry, index, canEdit, onUpdate, onRemove }) {
  const [label, setLabel] = useState(entry.label || "");
  const [value, setValue] = useState(entry.value || "");
  const timer = useRef(null);

  const prevEntry = useRef(entry);
  useEffect(() => {
    if (JSON.stringify(entry) !== JSON.stringify(prevEntry.current)) {
      prevEntry.current = entry;
      if (!timer.current) { setLabel(entry.label || ""); setValue(entry.value || ""); }
    }
  }, [entry]);

  const save = (newLabel, newValue) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      onUpdate(index, { label: newLabel, value: newValue });
    }, 800);
  };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-[var(--border)]/20">
      {canEdit ? (
        <>
          <input
            value={label}
            onChange={(e) => { setLabel(e.target.value); save(e.target.value, value); }}
            className="bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-0.5 text-xs text-[var(--text-muted)] font-medium w-40 focus:border-blue-500 focus:outline-none"
            placeholder="Technology name"
          />
          <input
            value={value}
            onChange={(e) => { setValue(e.target.value); save(label, e.target.value); }}
            className="bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-0.5 text-xs text-[var(--text)] font-mono flex-1 focus:border-blue-500 focus:outline-none"
            placeholder="Vendor / details"
          />
          <button onClick={() => onRemove(index)} className="text-[var(--text-muted)] hover:text-red-400 transition p-0.5">
            <Trash2 className="w-3 h-3"/>
          </button>
        </>
      ) : (
        <>
          <span className="text-[var(--text-muted)] text-xs w-40">{entry.label || "—"}</span>
          <span className="text-[var(--text)] font-mono text-xs">{entry.value || "—"}</span>
        </>
      )}
    </div>
  );
}

export default function WorkflowTab({ data, canEdit, onSave }) {
  const ov = data.overview || {};
  const wt = data.workflow_technical || {};
  const [showPasswords, setShowPasswords] = useState({});

  // Custom tech entries (stored as JSON in tech_custom column)
  const parseCustom = (raw) => { try { return JSON.parse(raw) || []; } catch { return []; } };
  const [customEntries, setCustomEntries] = useState(() => parseCustom(wt.tech_custom));
  const prevCustomJson = useRef(wt.tech_custom);
  useEffect(() => {
    if (wt.tech_custom !== prevCustomJson.current) {
      prevCustomJson.current = wt.tech_custom;
      setCustomEntries(parseCustom(wt.tech_custom));
    }
  }, [wt.tech_custom]);

  // Each TechInput saves its own field — we merge into full object and send
  const latestWt = useRef(wt);
  useEffect(() => { latestWt.current = data.workflow_technical || {}; }, [data.workflow_technical]);

  const saveField = (field, value) => {
    if (!canEdit) return;
    const payload = { ...latestWt.current, [field]: value };
    delete payload.id;
    delete payload.scope_id;
    onSave("workflow_technical", payload);
  };

  const saveCustomEntries = (entries) => {
    saveField("tech_custom", JSON.stringify(entries));
  };

  const addCustomEntry = () => {
    const updated = [...customEntries, { label: "", value: "" }];
    setCustomEntries(updated);
  };

  const updateCustomEntry = (index, entry) => {
    const updated = [...customEntries];
    updated[index] = entry;
    setCustomEntries(updated);
    saveCustomEntries(updated);
  };

  const removeCustomEntry = (index) => {
    const updated = customEntries.filter((_, i) => i !== index);
    setCustomEntries(updated);
    saveCustomEntries(updated);
  };

  const togglePwVisibility = (field) => setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Left column: Fleet Info */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Fleet Information</h3>
          <p className="text-[10px] text-[var(--text-muted)] mb-4">Read-only data from Overview tab</p>
          <LinkedField label="Fleet Name" value={data.fleet_name}/>
          <LinkedField label="Number of Drivers" value={ov.num_drivers}/>
          <LinkedField label="Number of Tractors" value={ov.num_tractors}/>
          <LinkedField label="Number of Trailers" value={ov.num_trailers}/>
          <LinkedField label="Type of Company" value={ov.type_of_company}/>
          <LinkedField label="Type of Operation(s)" value={ov.type_of_operation}/>
          <LinkedField label="Operating Companies" value={ov.operating_companies}/>
          <LinkedField label="Offices/Terminals" value={ov.offices_terminals}/>
          <LinkedField label="Border Crossing" value={ov.border_crossing}/>
        </div>

        {/* Right column: TMS & Telematics */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">TMS & Telematics</h3>
          <p className="text-[10px] text-[var(--text-muted)] mb-4">Read-only data from Overview tab</p>
          <div className="grid grid-cols-2 gap-x-4">
            <div>
              <p className="text-[10px] text-amber-400 font-semibold mb-2 uppercase">Current</p>
              <LinkedField label="Telematics Provider" value={ov.current_tsp}/>
              <LinkedField label="TMS" value={ov.current_tms}/>
              <LinkedField label="TMS Type" value={ov.current_tms_type}/>
              <LinkedField label="TMS Version" value={ov.current_tms_version}/>
              <LinkedField label="Using Workflow" value={ov.workflow_current||"No"}/>
              <LinkedField label="Workflow Integrator" value={ov.workflow_integrator_current}/>
              <LinkedField label="Systems Integrator" value={ov.systems_integrator_current}/>
            </div>
            <div>
              <p className="text-[10px] text-emerald-400 font-semibold mb-2 uppercase">Future</p>
              <LinkedField label="Telematics Platform" value={ov.ps_platform}/>
              <LinkedField label="TMS" value={ov.future_tms}/>
              <LinkedField label="TMS Type" value={ov.future_tms_type}/>
              <LinkedField label="TMS Version" value={ov.future_tms_version}/>
              <LinkedField label="Using Workflow" value={ov.workflow_future||"Yes"}/>
              <LinkedField label="Workflow Integrator" value={ov.workflow_integrator_future}/>
              <LinkedField label="Systems Integrator" value={ov.systems_integrator_future}/>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--border)]/30">
            <LinkedField label="Other Hardware Used" value={ov.other_hardware_used}/>
            <LinkedField label="Other Hardware Needed" value={ov.other_hardware_needed}/>
          </div>
        </div>
      </div>

      {/* Other Technology Grid — Editable */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Other Technology Applications</h3>
        <p className="text-[10px] text-[var(--text-muted)] mb-4">Enter vendor/product names or details for each technology</p>
        <div className="grid grid-cols-2 gap-x-8 text-xs">
          {[
            {label:"TPMS", field:"tech_tpms"},
            {label:"Trailer Tracking", field:"tech_trailer_tracking"},
            {label:"Freight Visibility", field:"tech_freight_visibility"},
            {label:"Lane Departure", field:"tech_lane_departure"},
            {label:"In-Cab Navigation", field:"tech_incab_navigation"},
            {label:"Trailer Tracking TMS", field:"tech_trailer_tracking_tms"},
            {label:"Video Safety", field:"tech_video_safety"},
            {label:"Load Optimization", field:"tech_load_optimization"},
            {label:"Learning Mgmt System", field:"tech_lms"},
            {label:"Trailer Temp Tracking", field:"tech_trailer_temp"},
            {label:"Video/Camera", field:"tech_video_camera"},
            {label:"Quotes", field:"tech_quotes"},
            {label:"Fuel Management", field:"tech_fuel_management"},
            {label:"Scanning", field:"tech_scanning"},
            {label:"In-Cab Safety", field:"tech_incab_safety"},
            {label:"Route Compliance", field:"tech_route_compliance"},
            {label:"Fuel Tax", field:"tech_fuel_tax"},
            {label:"Truck Stop", field:"tech_truck_stop"},
            {label:"In-Cab Coaching", field:"tech_incab_coaching"},
            {label:"Mobile Device Mgmt", field:"tech_mdm"},
            {label:"Fuel Optimization", field:"tech_fuel_optimization"},
            {label:"Maintenance", field:"tech_maintenance"},
            {label:"Training", field:"tech_training"},
            {label:"Speed Control", field:"tech_speed_control"},
            {label:"Fuel Cards", field:"tech_fuel_cards"},
            {label:"Weigh Station Bypass", field:"tech_weigh_station"},
            {label:"Compliance", field:"tech_compliance"},
            {label:"Speeding (Posted)", field:"tech_speeding_posted"},
            {label:"Driver Companion App", field:"tech_driver_companion"},
            {label:"Scales", field:"tech_scales"},
            {label:"Payroll", field:"tech_payroll"},
            {label:"In-Cab Wellness", field:"tech_incab_wellness"},
          ].map(p=><TechInput key={p.field} {...p} canEdit={canEdit} savedValue={wt[p.field]} onSave={saveField} showPw={false} onTogglePw={togglePwVisibility}/>)}
        </div>

        {/* Custom entries */}
        {(customEntries.length > 0 || canEdit) && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]/30">
            <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold mb-2">Custom Technology</p>
            {customEntries.map((entry, i) => (
              <CustomTechEntry key={i} entry={entry} index={i} canEdit={canEdit} onUpdate={updateCustomEntry} onRemove={removeCustomEntry}/>
            ))}
            {canEdit && (
              <button onClick={addCustomEntry} className="mt-2 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition">
                <Plus className="w-3 h-3"/> Add technology
              </button>
            )}
          </div>
        )}
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
      </div>

      {/* Technical Info — Editable */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-rose-400"/>
          <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider">PS Enterprise Workflow Requirements</h3>
        </div>
        <p className="text-[10px] text-amber-400/80 mb-4">Credentials stored in this section are saved locally on this device. Handle with care.</p>

        <div className="grid grid-cols-2 gap-x-8 text-xs mb-6">
          <div className="font-semibold text-[var(--text-secondary)] col-span-2 mb-1">Technical Information</div>
          {[
            {label:"Hostname (Production)", field:"pse_hostname_prod"},
            {label:"Hostname (Development)", field:"pse_hostname_dev"},
            {label:"Database Name (Production)", field:"pse_db_name_prod"},
            {label:"Database Name (Development)", field:"pse_db_name_dev"},
            {label:"Access Level (Production)", field:"pse_access_level_prod"},
            {label:"Access Level (Development)", field:"pse_access_level_dev"},
            {label:"Totalmail Server TZ", field:"pse_totalmail_tz", placeholder:ov.fleet_timezone||"—"},
            {label:"Totalmail IP Address", field:"pse_tm_ip"},
            {label:"Totalmail Username", field:"pse_tm_username"},
            {label:"Totalmail Password", field:"pse_tm_password", type:"password"},
            {label:"TMS Name", field:"pse_tms_name", placeholder:ov.current_tms||"—"},
          ].map(p=><TechInput key={p.field} {...p} canEdit={canEdit} savedValue={wt[p.field]} onSave={saveField} showPw={showPasswords[p.field]} onTogglePw={togglePwVisibility}/>)}

          <div className="font-semibold text-[var(--text-secondary)] col-span-2 mt-3 mb-1">TMS Database</div>
          {[
            {label:"Access Level", field:"tms_access_level"},
            {label:"IP Address", field:"tms_ip_address"},
            {label:"Username", field:"tms_username"},
            {label:"Password", field:"tms_password", type:"password"},
            {label:"Telematics Provided", field:"tms_telematics_provided", placeholder:ov.current_tsp||"—"},
            {label:"Portal URL", field:"tms_portal_url"},
            {label:"Portal Username", field:"tms_portal_username"},
            {label:"Portal Password", field:"tms_portal_password", type:"password"},
          ].map(p=><TechInput key={p.field} {...p} canEdit={canEdit} savedValue={wt[p.field]} onSave={saveField} showPw={showPasswords[p.field]} onTogglePw={togglePwVisibility}/>)}
        </div>

        <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-4">PS Plus Workflow Requirements</h3>
        <div className="grid grid-cols-2 gap-x-8 text-xs">
          {[
            {label:"Company ID Production", field:"psplus_cid_prod", hint:"CID"},
            {label:"Company ID Test", field:"psplus_cid_test", hint:"CID"},
            {label:"Company ID Development", field:"psplus_cid_dev", hint:"CID"},
            {label:"IP Addresses to Whitelist", field:"psplus_ip_whitelist"},
            {label:"Integration Username", field:"psplus_integration_username"},
            {label:"Integration Password", field:"psplus_integration_pw", type:"password"},
            {label:"Enterprise ID", field:"psplus_enterprise_id", hint:"Master Data Exchange"},
          ].map(p=><TechInput key={p.field} {...p} canEdit={canEdit} savedValue={wt[p.field]} onSave={saveField} showPw={showPasswords[p.field]} onTogglePw={togglePwVisibility}/>)}
        </div>
      </div>
    </div>
  );
}
