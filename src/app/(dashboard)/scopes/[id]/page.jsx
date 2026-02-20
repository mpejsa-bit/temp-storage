"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, Copy, X, Plus, Trash2, Building2, Phone, ShoppingBag, Puzzle, AlertTriangle, MessageSquare, GraduationCap, ClipboardList, Workflow, Calendar, BarChart3, Check, Link2, Home, Database, Download, ChevronDown, ExternalLink, ChevronRight } from "lucide-react";
import { useDebounce, useDebouncedCallback } from "@/hooks/useDebounce";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FleetSummary } from "@/components/scope/CrossTabBanner";
import { useToast } from "@/components/Toast";
import WorkflowTabComp from "@/components/scope/WorkflowTab";
import WorkshopTabComp from "@/components/scope/WorkshopTab";
import SolutionLinkedSection from "@/components/scope/SolutionLinkedSection";
import { SFLookupTab, KMLookupTab } from "@/components/scope/MarketplaceLookupTab";
import TrainingTabComp from "@/components/scope/TrainingTab";
import FormsTabComp from "@/components/scope/FormsTab";
import MasterDataTab from "@/components/scope/MasterDataTab";
import CityAutocomplete from "@/components/scope/CityAutocomplete";
import CompletionBar, { CompletionDot } from "@/components/scope/CompletionBar";

function formatPhone(value) {
  const digits = (value||'').replace(/\D/g,'').slice(0,10);
  if(!digits) return '';
  if(digits.length<=3) return `(${digits}`;
  if(digits.length<=6) return `(${digits.slice(0,3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
}

function isValidEmail(v) {
  if (!v) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function ContactInlineInput({val,onChange,dis,bold,sz}) {
  return <input className={`bg-transparent border-none ${bold?"text-[var(--text)]":"text-[var(--text-secondary)]"} text-sm ${sz?"":"w-full"} focus:outline-none`} value={val||""} onChange={e=>onChange(e.target.value)} disabled={dis} placeholder="—" {...(sz?{size:sz}:{})}/>;
}

function ContactEmailInput({val,onChange,dis}) {
  const invalid = val && !isValidEmail(val);
  return (
    <div className="relative">
      <input className={`bg-transparent text-[var(--text-secondary)] text-sm focus:outline-none ${invalid ? "border-b border-red-500 text-red-400" : "border-none"}`} value={val||""} onChange={e=>onChange(e.target.value)} disabled={dis} placeholder="email@example.com" size={20}/>
      {invalid && <span className="absolute -bottom-4 left-0 text-[10px] text-red-400">Invalid email</span>}
    </div>
  );
}

function ContactPhoneInput({val,onChange,dis}) {
  return <input className="bg-transparent border-none text-[var(--text-secondary)] text-sm focus:outline-none" value={formatPhone(val)} onChange={e=>onChange(formatPhone(e.target.value))} disabled={dis} placeholder="(000) 000-0000" size={14}/>;
}

const TABS = [
  { id: "summary", label: "Start Here", icon: Home },
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "contacts", label: "Contacts", icon: Phone },
  { id: "marketplace", label: "Marketplace & UPAs", icon: ShoppingBag },
  { id: "solution", label: "Solution Mix", icon: Puzzle },
  { id: "gaps", label: "Gaps", icon: AlertTriangle },
  { id: "workshop", label: "Workshop", icon: MessageSquare },
  { id: "training", label: "Training", icon: GraduationCap },
  { id: "forms", label: "Forms", icon: ClipboardList },
  { id: "install", label: "Install Strategy", icon: Calendar },
  { id: "workflow", label: "Workflow Integration", icon: Workflow },
  { id: "master_data", label: "Master Data", icon: Database, children: [
    { id: "sf_lookup", label: "SF Lookup" },
    { id: "km_lookup", label: "KM Lookup" },
  ]},
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "sharing", label: "Sharing & Team", icon: Users },
];

function Field({ label, value, onChange, disabled, type="text", options, placeholder, wide, hint, required: isRequired, missing: isMissing }) {
  const baseCls = "w-full px-3 py-2 bg-[var(--bg-secondary)] border rounded-lg text-[var(--text)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 transition disabled:opacity-50";
  const borderCls = isMissing ? "border-amber-500/60" : "border-[var(--border)]";
  const cls = `${baseCls} ${borderCls}`;
  return (
    <div className={wide?"col-span-2":""}>
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
        {label}{isRequired && <span className="text-amber-400 ml-1">*</span>}
      </label>
      {hint && <p className="text-[10px] text-[var(--text-muted)] mb-1">{hint}</p>}
      {type==="select"&&options ? <select value={value||""} onChange={e=>onChange(e.target.value)} disabled={disabled} className={cls}><option value="">— Select —</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>
      : type==="textarea" ? <textarea value={value||""} onChange={e=>onChange(e.target.value)} disabled={disabled} rows={3} className={cls} placeholder={placeholder}/>
      : type==="number" ? <input type="number" value={value??""} onChange={e=>onChange(e.target.value?parseInt(e.target.value):null)} disabled={disabled} className={cls} placeholder={placeholder} min="0"/>
      : type==="checkbox" ? <button type="button" role="checkbox" aria-checked={!!value} tabIndex={0} onClick={()=>!disabled&&onChange(value?0:1)} onKeyDown={e=>{if((e.key===" "||e.key==="Enter")&&!disabled){e.preventDefault();onChange(value?0:1);}}} disabled={disabled} className={`w-6 h-6 rounded border ${value?"bg-blue-600 border-blue-500":"bg-[var(--bg-secondary)] border-[var(--border)]"} flex items-center justify-center`}>{value?<Check className="w-4 h-4 text-[var(--text)]"/>:null}</button>
      : <input type={type} value={value||""} onChange={e=>onChange(e.target.value)} disabled={disabled} className={cls} placeholder={placeholder}/>}
    </div>
  );
}

function UrlField({ label, value, onChange, disabled, placeholder }) {
  const cls = "w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 transition disabled:opacity-50";
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="flex gap-2">
        <input type="text" value={value||""} onChange={e=>onChange(e.target.value)} disabled={disabled} className={cls} placeholder={placeholder||"https://..."}/>
        {value && <a href={value.startsWith("http")?value:`https://${value}`} target="_blank" rel="noopener noreferrer" className="flex items-center px-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-blue-400 hover:text-blue-300" onClick={e=>e.stopPropagation()}><ExternalLink className="w-4 h-4"/></a>}
      </div>
    </div>
  );
}

function OverviewTab({ data, canEdit, onSave, refData, requiredFields=[], missingFields=[] }) {
  const reqSet = new Set(requiredFields);
  const missSet = new Set(missingFields);
  const fp = (key) => ({ required: reqSet.has(key), missing: missSet.has(key) });
  const today = new Date().toLocaleDateString("en-US",{month:"2-digit",day:"2-digit",year:"numeric"});
  const initOv = (o) => ({...o, date_lead_provided: o?.date_lead_provided || today});
  const [ov, setOv] = useState(initOv(data.overview||{}));
  const set = (k,v) => setOv(p=>({...p,[k]:v}));
  const prevOvJson = useRef(JSON.stringify(data.overview||{}));
  useEffect(()=>{const json=JSON.stringify(data.overview||{});if(json!==prevOvJson.current){prevOvJson.current=json;setOv(initOv(data.overview||{}));}},[data.overview]);
  const debouncedOv = useDebounce(ov, 800);
  const lastSavedOvJson = useRef(JSON.stringify(initOv(data.overview||{})));
  useEffect(()=>{const json=JSON.stringify(debouncedOv);if(json===lastSavedOvJson.current) return;lastSavedOvJson.current=json;if(canEdit) onSave("overview",debouncedOv);},[debouncedOv]);
  const ref = (cat, fallback=[]) => refData[cat]?.length ? refData[cat] : fallback;
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-5">
        <p className="text-sm text-blue-300 font-medium">{data.fleet_name} is a {ov.fleet_size_label||"—"} {ov.type_of_operation||"—"} {ov.current_technology||"—"} {ov.fleet_persona||"—"} fleet</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Auto-computed fleet summary</p>
      </div>
      <section><h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Fleet Profile</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fleet Name" value={ov.fleet_name??data.fleet_name} onChange={v=>set("fleet_name",v)} disabled={!canEdit} {...fp("fleet_name")}/>
          <CityAutocomplete label="HQ Location" value={ov.hq_location} onChange={v=>set("hq_location",v)} onCitySelect={(city)=>{set("hq_location",`${city.city}, ${city.state}`);set("fleet_timezone",city.timezone);}} disabled={!canEdit} placeholder="City, ST (US only)" required={reqSet.has("hq_location")} missing={missSet.has("hq_location")}/>
          <Field label="PS Platform" value={ov.ps_platform} onChange={v=>set("ps_platform",v)} disabled={!canEdit} type="select" options={ref("ps_platform",["PS Enterprise","PS+"])} hint="Platform Science product line" {...fp("ps_platform")}/>
          <Field label="Fleet Timezone" value={ov.fleet_timezone} onChange={v=>set("fleet_timezone",v)} disabled={!canEdit} type="select" options={ref("fleet_timezone",["Eastern","Central","Mountain","Pacific","Alaska","Hawaii"])} hint="Auto-set when selecting a US city" {...fp("fleet_timezone")}/>
          <Field label="Current Technology" value={ov.current_technology} onChange={v=>set("current_technology",v)} disabled={!canEdit} type="select" options={ref("current_technology",["Pre-Mobility","Mobility"])} {...fp("current_technology")}/>
          <Field label="Fleet Persona" value={ov.fleet_persona} onChange={v=>set("fleet_persona",v)} disabled={!canEdit} type="select" options={ref("fleet_persona",["Innovator","Early Adopter","Early Majority","Late Majority","Influencer"])} hint="Technology adoption profile" {...fp("fleet_persona")}/>
          <Field label="Type of Company" value={ov.type_of_company} onChange={v=>set("type_of_company",v)} disabled={!canEdit} type="select" options={ref("company_type",["Private Fleet/Shipper","Brokerage/3PL","Maintenance Service Center","Fuel/Energy","Autohauler"])} {...fp("type_of_company")}/>
          <Field label="Type of Operation" value={ov.type_of_operation} onChange={v=>set("type_of_operation",v)} disabled={!canEdit} type="select" options={ref("operation_type",["General Freight","Reefer","LTL","Retail/Wholesale","Bulk/Petrol/Chem/Tanker","Intermodal"])} {...fp("type_of_operation")}/>
        </div>
      </section>
      <section><h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Fleet Size</h3>
        <div className="grid grid-cols-3 gap-4">
          <Field label="# Drivers" value={ov.num_drivers} onChange={v=>set("num_drivers",v)} disabled={!canEdit} type="number" {...fp("num_drivers")}/>
          <Field label="# Tractors" value={ov.num_tractors} onChange={v=>set("num_tractors",v)} disabled={!canEdit} type="number" {...fp("num_tractors")}/>
          <Field label="# Trailers" value={ov.num_trailers} onChange={v=>set("num_trailers",v)} disabled={!canEdit} type="number" {...fp("num_trailers")}/>
        </div>
      </section>
      <section><h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">TMS & Technology</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Current TSP" value={ov.current_tsp} onChange={v=>set("current_tsp",v)} disabled={!canEdit} placeholder="e.g. Omni" {...fp("current_tsp")}/>
          <Field label="Current TMS" value={ov.current_tms} onChange={v=>set("current_tms",v)} disabled={!canEdit} type="select" options={ref("tms_provider",["ICC/Innovative","McLeod","TMW","Trimble","MercuryGate","Oracle","SAP","BluJay","Descartes","Other:"])} {...fp("current_tms")}/>
          <Field label="Current TMS Type" value={ov.current_tms_type} onChange={v=>set("current_tms_type",v)} disabled={!canEdit} type="select" options={ref("tms_type",["Cloud","Hosted","SaaS","On-Prem"])}/>
          <Field label="Current TMS Version" value={ov.current_tms_version} onChange={v=>set("current_tms_version",v)} disabled={!canEdit}/>
          <Field label="Future TMS" value={ov.future_tms} onChange={v=>set("future_tms",v)} disabled={!canEdit} type="select" options={ref("tms_provider",["ICC/Innovative","McLeod","TMW","Trimble","MercuryGate","Oracle","SAP","BluJay","Descartes","Other:"])}/>
          <Field label="Future TMS Type" value={ov.future_tms_type} onChange={v=>set("future_tms_type",v)} disabled={!canEdit} type="select" options={ref("tms_type",["Cloud","Hosted","SaaS","On-Prem"])}/>
        </div>
      </section>
      <section><h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Account & Links</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Account Executive" value={ov.account_executive} onChange={v=>set("account_executive",v)} disabled={!canEdit} {...fp("account_executive")}/>
          <Field label="Date Lead Provided" value={ov.date_lead_provided} onChange={v=>set("date_lead_provided",v)} disabled={!canEdit} placeholder="MM/DD/YYYY"/>
          <UrlField label="Contract Link" value={ov.contract_link} onChange={v=>set("contract_link",v)} disabled={!canEdit}/>
          <UrlField label="SF Opportunity Link" value={ov.sf_opportunity_link} onChange={v=>set("sf_opportunity_link",v)} disabled={!canEdit}/>
          <UrlField label="Master Notes" value={ov.master_notes_link} onChange={v=>set("master_notes_link",v)} disabled={!canEdit}/>
          <UrlField label="Customer Dossier" value={ov.customer_dossier_link} onChange={v=>set("customer_dossier_link",v)} disabled={!canEdit}/>
        </div>
      </section>
      {/* Hardware Overview (rows 47-58) */}
      <section><h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Hardware Overview</h3>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-auto">
          <table className="w-full text-sm"><thead><tr className="bg-blue-500/20/50">
            {["Item","Type","SKU","Expected Amount","Notes"].map(h=><th key={h} className="text-left px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold">{h}</th>)}
          </tr></thead><tbody>
            {(()=>{let hw=[];try{hw=JSON.parse(ov.hardware_json||"[]")}catch{}
              if(!hw.length) hw=["Tablets","On-Board Computer (PS+)","Ball Mount","Mounting Arms","Knox Provisioning","Camera Video Devices","Cable 1","Cable 2","Cable 3","Cable 4"].map(n=>({name:n,type:"",sku:"",amount:"",notes:""}));
              return hw.map((h,i)=>(
                <tr key={i} className="border-t border-[var(--border)]/50 hover:bg-[var(--bg-card)]">
                  <td className="px-4 py-2 text-[var(--text)] font-medium text-xs">{h.name}</td>
                  {["type","sku","amount","notes"].map(f=>(
                    <td key={f} className="px-4 py-1"><input className="w-full bg-transparent text-[var(--text-secondary)] text-xs focus:outline-none" value={h[f]||""} onChange={e=>{const up=[...hw];up[i]={...up[i],[f]:e.target.value};set("hardware_json",JSON.stringify(up))}} disabled={!canEdit} placeholder="—"/></td>
                  ))}
                </tr>))})()}
          </tbody></table>
        </div>
      </section>
      {/* Vehicle Breakdown (rows 59-91) */}
      <section><h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Vehicle Breakdown</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <UrlField label="Vehicle List Link" value={ov.vehicle_list_link} onChange={v=>set("vehicle_list_link",v)} disabled={!canEdit}/>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-auto">
          <table className="w-full text-sm"><thead><tr className="bg-blue-500/20/50">
            {["How Many?","Year","Make","Model"].map(h=><th key={h} className="text-left px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold">{h}</th>)}
            {canEdit&&<th className="w-10"/>}
          </tr></thead><tbody>
            {(()=>{let veh=[];try{veh=JSON.parse(ov.vehicles_json||"[]")}catch{}
              return veh.length?veh.map((v,i)=>(
                <tr key={i} className="border-t border-[var(--border)]/50">
                  {["count","year","make","model"].map(f=>(
                    <td key={f} className="px-4 py-1">{f==="make"?
                      <select className="bg-transparent text-[var(--text)] text-xs focus:outline-none" value={v.make||""} onChange={e=>{const up=[...veh];up[i]={...up[i],make:e.target.value};set("vehicles_json",JSON.stringify(up))}} disabled={!canEdit}>
                        <option value="">—</option>{["International","Freightliner","Kenworth","Hino","Peterbilt","Volvo"].map(m=><option key={m}>{m}</option>)}
                      </select>:
                      <input className="w-full bg-transparent text-[var(--text-secondary)] text-xs focus:outline-none" value={v[f]||""} onChange={e=>{const up=[...veh];up[i]={...up[i],[f]:e.target.value};set("vehicles_json",JSON.stringify(up))}} disabled={!canEdit}/>}
                    </td>))}
                  {canEdit&&<td><button onClick={()=>{const up=veh.filter((_,j)=>j!==i);set("vehicles_json",JSON.stringify(up))}} className="text-red-400/40 hover:text-red-400"><Trash2 className="w-3 h-3"/></button></td>}
                </tr>)):
                <tr><td colSpan={5} className="px-4 py-6 text-center text-[var(--text-muted)] text-xs">No vehicles listed</td></tr>})()}
          </tbody></table>
        </div>
        {canEdit&&<button onClick={()=>{let veh=[];try{veh=JSON.parse(ov.vehicles_json||"[]")}catch{} veh.push({count:"",year:"",make:"",model:""});set("vehicles_json",JSON.stringify(veh))}} className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"><Plus className="w-3 h-3"/> Add Vehicle Row</button>}
      </section>
      {/* Fuel Haulers & Shipment Details (rows 92-109) */}
      <section><h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Fuel Haulers & Shipment Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Do you have tankers?" value={ov.has_tankers} onChange={v=>set("has_tankers",v)} disabled={!canEdit} type="select" options={ref("yes_no",["Yes","No"])}/>
          <Field label="# of single compartments?" value={ov.single_compartments} onChange={v=>set("single_compartments",v)} disabled={!canEdit}/>
          <Field label="# of multiple compartments?" value={ov.multiple_compartments} onChange={v=>set("multiple_compartments",v)} disabled={!canEdit}/>
          <Field label="Rented or foreign trailers?" value={ov.rented_foreign_trailers} onChange={v=>set("rented_foreign_trailers",v)} disabled={!canEdit} type="select" options={["Rented","Foreign","Both"]}/>
          <Field label="Do you use containers?" value={ov.use_containers} onChange={v=>set("use_containers",v)} disabled={!canEdit} type="select" options={ref("yes_no",["Yes","No"])}/>
          <Field label="Do you use chassis?" value={ov.use_chassis} onChange={v=>set("use_chassis",v)} disabled={!canEdit} type="select" options={ref("yes_no",["Yes","No"])}/>
          <Field label="Handle parcel shipments?" value={ov.parcel_shipments} onChange={v=>set("parcel_shipments",v)} disabled={!canEdit} type="select" options={ref("yes_no",["Yes","No"])}/>
          <Field label="Handle multi-stop orders?" value={ov.multi_stop_orders} onChange={v=>set("multi_stop_orders",v)} disabled={!canEdit} type="select" options={ref("yes_no",["Yes","No"])}/>
          <Field label="Commodities hauled" value={ov.commodities_hauled} onChange={v=>set("commodities_hauled",v)} disabled={!canEdit} wide/>
          <Field label="Multi-mode transport?" value={ov.multi_mode_transport} onChange={v=>set("multi_mode_transport",v)} disabled={!canEdit} type="select" options={ref("yes_no",["Yes","No"])}/>
          <Field label="How handle split loads?" value={ov.split_loads} onChange={v=>set("split_loads",v)} disabled={!canEdit}/>
          <Field label="Multi-leg shipments?" value={ov.multi_leg_shipments} onChange={v=>set("multi_leg_shipments",v)} disabled={!canEdit} type="select" options={ref("yes_no",["Yes","No"])}/>
          <Field label="Freight via rail?" value={ov.freight_via_rail} onChange={v=>set("freight_via_rail",v)} disabled={!canEdit} type="select" options={ref("yes_no",["Yes","No"])}/>
          <Field label="Haul petroleum/liquids?" value={ov.petroleum_liquids} onChange={v=>set("petroleum_liquids",v)} disabled={!canEdit} type="select" options={ref("yes_no",["Yes","No"])}/>
          <Field label="Consolidate loads?" value={ov.consolidate_loads} onChange={v=>set("consolidate_loads",v)} disabled={!canEdit} type="select" options={ref("yes_no",["Yes","No"])}/>
          <Field label="Pick-up/drop-off process" value={ov.pickup_dropoff_process} onChange={v=>set("pickup_dropoff_process",v)} disabled={!canEdit} wide/>
        </div>
      </section>
    </div>
  );
}

function ContactsTab({ data, canEdit, onSave }) {
  const [contacts, setContacts] = useState(data.contacts || []);
  const prevContactsJson = useRef(JSON.stringify(data.contacts||[]));
  useEffect(() => { const json=JSON.stringify(data.contacts||[]);if(json!==prevContactsJson.current){prevContactsJson.current=json;setContacts(data.contacts || []);} }, [data.contacts]);
  const debouncedContacts = useDebounce(contacts, 800);
  const lastSavedContactsJson = useRef(JSON.stringify(data.contacts||[]));
  useEffect(()=>{const json=JSON.stringify(debouncedContacts);if(json===lastSavedContactsJson.current) return;lastSavedContactsJson.current=json;if(canEdit) onSave("contacts",debouncedContacts,"bulk");},[debouncedContacts]);

  // Auto-fill Account Executive name from Overview
  const aeFromOverview = data.overview?.account_executive || "";
  useEffect(() => {
    if (!aeFromOverview) return;
    setContacts(prev => {
      const ae = prev.find(c => c.contact_type === "ps_team" && c.role_title === "Account Executive");
      if (ae && !ae.name) return prev.map(c => c.id === ae.id ? { ...c, name: aeFromOverview } : c);
      return prev;
    });
  }, [aeFromOverview]);

  const ps = contacts.filter(c=>c.contact_type==="ps_team");
  const fleet = contacts.filter(c=>c.contact_type==="fleet");

  const upd = (id,f,v) => setContacts(prev=>prev.map(c=>c.id===id?{...c,[f]:v}:c));

  return (
    <div className="space-y-8">
      <div><h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">PS Team</h3>
        <p className="text-xs text-[var(--text-muted)] mb-4">Platform Science internal team members. Role names are preset and cannot be changed.</p>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-blue-500/20/50">
          {["Role","Name","Email","Phone"].map(h=><th key={h} className="text-left px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold">{h}</th>)}
        </tr></thead><tbody>{ps.map(c=>(
          <tr key={c.id} className="border-t border-[var(--border)]/50 hover:bg-[var(--bg-card)]">
            <td className="px-4 py-2 text-blue-400 font-medium text-xs w-48">{c.role_title}:</td>
            <td className="px-4 py-2"><ContactInlineInput val={c.name} onChange={v=>upd(c.id,"name",v)} dis={!canEdit} bold sz={20}/></td>
            <td className="px-4 py-2"><ContactEmailInput val={c.email} onChange={v=>upd(c.id,"email",v)} dis={!canEdit}/></td>
            <td className="px-4 py-2"><ContactPhoneInput val={c.phone} onChange={v=>upd(c.id,"phone",v)} dis={!canEdit}/></td>
          </tr>))}</tbody></table></div>
      </div>
      <div><div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">Fleet Contacts</h3>
        <p className="text-xs text-[var(--text-muted)]">Customer-side contacts for this fleet.</p>
        {canEdit&&<button onClick={()=>onSave("contacts",{contact_type:"fleet",role_title:"",name:"",sort_order:fleet.length})} className="flex items-center gap-1 text-xs text-blue-400"><Plus className="w-3.5 h-3.5"/> Add</button>}
      </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-blue-500/20/50">
          {["Role","Name","Email","Phone"].map(h=><th key={h} className="text-left px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold">{h}</th>)}
          {canEdit&&<th className="w-10"/>}
        </tr></thead><tbody>
          {fleet.length===0?<tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)] text-sm">No fleet contacts yet</td></tr>:
          fleet.map(c=>(
            <tr key={c.id} className="border-t border-[var(--border)]/50 hover:bg-[var(--bg-card)]">
              <td className="px-4 py-2"><ContactInlineInput val={c.role_title} onChange={v=>upd(c.id,"role_title",v)} dis={!canEdit} bold/></td>
              <td className="px-4 py-2"><ContactInlineInput val={c.name} onChange={v=>upd(c.id,"name",v)} dis={!canEdit} bold sz={20}/></td>
              <td className="px-4 py-2"><ContactEmailInput val={c.email} onChange={v=>upd(c.id,"email",v)} dis={!canEdit}/></td>
              <td className="px-4 py-2"><ContactPhoneInput val={c.phone} onChange={v=>upd(c.id,"phone",v)} dis={!canEdit}/></td>
              {canEdit&&<td className="px-2"><button onClick={()=>onSave("contacts",{id:c.id},"delete")} className="p-1 hover:bg-red-500/10 rounded text-red-400"><Trash2 className="w-3.5 h-3.5"/></button></td>}
            </tr>))}
        </tbody></table></div>
      </div>
    </div>
  );
}

function SolutionNotesInput({value,onSave,disabled}) {
  const [local,setLocal] = useState(value||"");
  const timer = useRef(null);
  const prevValue = useRef(value||"");
  useEffect(()=>{if((value||"")!==prevValue.current){prevValue.current=value||"";setLocal(value||"");}},[value]);
  const handleChange = e => {
    const v = e.target.value;
    setLocal(v);
    if(timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(()=>{prevValue.current=v;onSave(v);}, 800);
  };
  useEffect(()=>()=>{if(timer.current) clearTimeout(timer.current)},[]);
  return <input className="bg-transparent border-none text-[var(--text-secondary)] text-sm w-full focus:outline-none" value={local} onChange={handleChange} disabled={disabled} placeholder="—"/>;
}

function SolutionTab({ data, canEdit, onSave }) {
  const toggle=(f,k)=>onSave("features",{...f,[k]:f[k]?0:1});
  const Chk=({val,c="blue"})=>(<div className={`w-5 h-5 rounded border mx-auto flex items-center justify-center ${val?`bg-${c}-600 border-${c}-500`:"bg-[var(--bg)] border-[var(--border)]"}`}>{val?<Check className="w-3 h-3 text-[var(--text)]"/>:null}</div>);
  return (
    <div>
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4 mb-6"><p className="text-xs text-blue-300">↑ Platform: <strong>{data.overview?.ps_platform||"—"}</strong> (linked from Overview)</p></div>
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-blue-500/20/50">
        {["Feature","Needed","Quote","Pilot","Production","Notes"].map(h=><th key={h} className={`px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold ${h==="Feature"||h==="Notes"?"text-left":"text-center"} ${h!=="Feature"&&h!=="Notes"?"w-20":""}`}>{h}</th>)}
      </tr></thead><tbody>{data.features.map(f=>(
        <tr key={f.id} className="border-t border-[var(--border)]/50 hover:bg-[var(--bg-card)]">
          <td className="px-4 py-2 font-medium text-[var(--text)]">{f.feature_name}</td>
          <td className="px-4 py-2 text-center cursor-pointer" onClick={()=>canEdit&&toggle(f,"needed")}><Chk val={f.needed}/></td>
          <td className="px-4 py-2 text-center cursor-pointer" onClick={()=>canEdit&&toggle(f,"required_for_quote")}><Chk val={f.required_for_quote} c="emerald"/></td>
          <td className="px-4 py-2 text-center cursor-pointer" onClick={()=>canEdit&&toggle(f,"required_for_pilot")}><Chk val={f.required_for_pilot} c="emerald"/></td>
          <td className="px-4 py-2 text-center cursor-pointer" onClick={()=>canEdit&&toggle(f,"required_for_production")}><Chk val={f.required_for_production} c="emerald"/></td>
          <td className="px-4 py-2"><SolutionNotesInput value={f.notes} onSave={v=>onSave("features",{...f,notes:v})} disabled={!canEdit}/></td>
        </tr>))}</tbody></table></div>
    </div>
  );
}

function GapsTab({ data, canEdit, onSave, requiredFields=[], missingFields=[] }) {
  const [gaps, setGaps] = useState(data.gaps || []);
  const prevJson = useRef(JSON.stringify(data.gaps||[]));
  useEffect(()=>{const json=JSON.stringify(data.gaps||[]);if(json!==prevJson.current){prevJson.current=json;setGaps(data.gaps||[]);}},[data.gaps]);
  const debouncedSave = useDebouncedCallback(onSave, 800);
  const upd = (id,field,val) => {
    setGaps(prev=>{const next=prev.map(g=>g.id===id?{...g,[field]:val}:g);const row=next.find(g=>g.id===id);if(row) debouncedSave("gaps",row);return next;});
  };
  const reqSet = new Set(requiredFields);
  const missSet = new Set(missingFields);
  const fp = (key) => ({ required: reqSet.has(key), missing: missSet.has(key) });
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--text-muted)]">Gaps or pain points identified during alignment.</p>
        {canEdit&&<button onClick={()=>onSave("gaps",{gap_number:gaps.length+1,sort_order:gaps.length})} className="flex items-center gap-1 text-xs text-blue-400"><Plus className="w-3.5 h-3.5"/> Add Gap</button>}
      </div>
      <div className="space-y-4">
        {gaps.length===0?<div className="text-center py-12 text-[var(--text-muted)]">No gaps yet</div>:
        gaps.map((g,i)=>(
          <div key={g.id} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded">Gap #{i+1}</span>
              {canEdit&&<button onClick={()=>onSave("gaps",{id:g.id},"delete")} className="text-red-400"><Trash2 className="w-4 h-4"/></button>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Gap Identified" value={g.gap_identified} onChange={v=>upd(g.id,"gap_identified",v)} disabled={!canEdit} wide {...fp("gap_identified")}/>
              <Field label="Use Case" value={g.use_case} onChange={v=>upd(g.id,"use_case",v)} disabled={!canEdit} type="textarea" wide {...fp("use_case")}/>
              <Field label="Business Development Team Engaged" value={g.bd_team_engaged} onChange={v=>upd(g.id,"bd_team_engaged",v)} disabled={!canEdit} type="checkbox"/>
              <Field label="Product Team Engaged" value={g.product_team_engaged} onChange={v=>upd(g.id,"product_team_engaged",v)} disabled={!canEdit} type="checkbox"/>
              <Field label="Customer Blocker" value={g.customer_blocker} onChange={v=>upd(g.id,"customer_blocker",v)} disabled={!canEdit} type="checkbox"/>
              <Field label="PSOP Ticket" value={g.psop_ticket} onChange={v=>upd(g.id,"psop_ticket",v)} disabled={!canEdit} hint="Platform Science Operations ticket reference"/>
            </div>
          </div>))}
      </div>
    </div>
  );
}

function MarketplaceTab({ data, canEdit, onSave }) {
  const debouncedSave = useDebouncedCallback(onSave, 800);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [catSearch, setCatSearch] = useState("");
  const [upas, setUpas] = useState(data.upas || []);
  const prevUpasJson = useRef(JSON.stringify(data.upas||[]));
  useEffect(()=>{const json=JSON.stringify(data.upas||[]);if(json!==prevUpasJson.current){prevUpasJson.current=json;setUpas(data.upas||[]);}},[data.upas]);
  const updUpa = (id,field,val) => {
    setUpas(prev=>{const next=prev.map(u=>u.id===id?{...u,[field]:val}:u);const row=next.find(u=>u.id===id);if(row) debouncedSave("upas",row);return next;});
  };
  const openCatalog = async () => { setShowCatalog(true); const r = await fetch("/api/ref?table=sf"); const d = await r.json(); setCatalog(d.data || []); };
  const addFromCatalog = async (p) => { await onSave("marketplace", { product_name:p.product_name, partner_account:p.partner_account, solution_type:p.solution_type, partner_category:p.partner_category, partner_subcategory:p.partner_subcategory, stage:p.stage, selected:1 }); setShowCatalog(false); };
  const filteredCatalog = catSearch ? catalog.filter(p => p.product_name?.toLowerCase().includes(catSearch.toLowerCase()) || p.partner_category?.toLowerCase().includes(catSearch.toLowerCase())) : catalog;
  return (
    <div className="space-y-8">
      <div><div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Marketplace Apps ({data.marketplace_apps.length})</h3>
        {canEdit && <button onClick={openCatalog} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20"><Plus className="w-3.5 h-3.5"/> Add from Catalog</button>}
      </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-auto"><table className="w-full text-sm"><thead><tr className="bg-blue-500/20/50">
          <th className="text-left px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold w-12">Valid</th>
          {["Product","Partner","Category","Stage"].map(h=><th key={h} className="text-left px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold">{h}</th>)}
          {canEdit&&<th className="w-10"/>}
        </tr></thead><tbody>
          {data.marketplace_apps.length===0?<tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">No marketplace apps — click Add from SF Catalog</td></tr>:
          data.marketplace_apps.map(a=>(
            <tr key={a.id} className="border-t border-[var(--border)]/50 hover:bg-[var(--bg-card)]">
              <td className="px-4 py-2"><span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">{a.product_name?"Yes":"No"}</span></td>
              <td className="px-4 py-2 text-[var(--text)] font-medium">{a.product_name}</td>
              <td className="px-4 py-2 text-[var(--text-secondary)]">{a.partner_account}</td>
              <td className="px-4 py-2 text-[var(--text-secondary)]">{a.partner_category}</td>
              <td className="px-4 py-2"><span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{a.stage}</span></td>
              {canEdit&&<td className="px-2"><button onClick={()=>onSave("marketplace",{id:a.id},"delete")} className="p-1 hover:bg-red-500/10 rounded text-red-400"><Trash2 className="w-3.5 h-3.5"/></button></td>}
            </tr>))}
        </tbody></table></div>
      </div>
      {showCatalog && <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={()=>setShowCatalog(false)} onKeyDown={e=>{if(e.key==="Escape")setShowCatalog(false)}}>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden" onClick={e=>e.stopPropagation()}>
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text)]">Select from SF Catalog ({catalog.length})</h3>
            <button onClick={()=>setShowCatalog(false)} className="text-[var(--text-muted)] hover:text-[var(--text)]"><X className="w-5 h-5"/></button>
          </div>
          <div className="p-4 border-b border-[var(--border)]"><input className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:border-blue-500" placeholder="Search..." value={catSearch} onChange={e=>setCatSearch(e.target.value)}/></div>
          <div className="overflow-y-auto max-h-[60vh]">{filteredCatalog.map(p=>(
            <button key={p.id} onClick={()=>addFromCatalog(p)} className="w-full text-left px-4 py-3 border-b border-[var(--border)]/30 hover:bg-[var(--bg-card)] transition">
              <div className="flex items-center justify-between">
                <div><span className="text-sm text-[var(--text)] font-medium">{p.product_name}</span><span className="text-xs text-[var(--text-muted)] ml-2">{p.partner_account}</span></div>
                <div className="flex gap-2"><span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">{p.partner_category}</span><span className={`text-[10px] px-2 py-0.5 rounded-full ${p.stage==="In Production"?"bg-emerald-500/10 text-emerald-400":"bg-amber-500/10 text-amber-400"}`}>{p.stage}</span></div>
              </div>
            </button>))}</div>
        </div>
      </div>}
      <div><div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">User Provided Apps ({upas.length})</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Custom apps not in the marketplace catalog</p>
        </div>
        {canEdit&&<button onClick={()=>onSave("upas",{name:"New App",sort_order:upas.length})} className="flex items-center gap-1 text-xs text-blue-400"><Plus className="w-3.5 h-3.5"/> Add App</button>}
      </div>
        <div className="space-y-3">
          {upas.map(u=>(
            <div key={u.id} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name" value={u.name} onChange={v=>updUpa(u.id,"name",v)} disabled={!canEdit}/>
                <Field label="Website URL" value={u.website_url} onChange={v=>updUpa(u.id,"website_url",v)} disabled={!canEdit}/>
                <Field label="Use Case" value={u.use_case} onChange={v=>updUpa(u.id,"use_case",v)} disabled={!canEdit} wide/>
                <Field label="Has Deep Link" value={u.has_deeplink} onChange={v=>{setUpas(prev=>prev.map(x=>x.id===u.id?{...x,has_deeplink:v}:x));onSave("upas",{...u,has_deeplink:v});}} disabled={!canEdit} type="checkbox" hint="Can open directly from the platform"/>
                {canEdit&&<div className="flex justify-end col-span-2"><button onClick={()=>onSave("upas",{id:u.id},"delete")} className="text-xs text-red-400 flex items-center gap-1"><Trash2 className="w-3 h-3"/> Remove</button></div>}
              </div>
            </div>))}
          {upas.length===0&&<div className="text-center py-8 text-[var(--text-muted)] text-sm">No custom apps added yet</div>}
        </div>
      </div>
    </div>
  );
}


function InstallNumInput({value,onSave,disabled}) {
  const [local,setLocal] = useState(String(value||0));
  const prevValue = useRef(value);
  useEffect(()=>{if(value!==prevValue.current){prevValue.current=value;setLocal(String(value||0));}},[value]);
  const handleChange = e => {
    const v = e.target.value.replace(/\D/g,"");
    setLocal(v);
    const n=parseInt(v)||0;
    prevValue.current=n;
    onSave(n);
  };
  return <input type="text" inputMode="numeric" className="w-12 bg-transparent text-center text-[var(--text)] text-sm focus:outline-none border-none" value={local} onChange={handleChange} disabled={disabled}/>;
}

function InstallTab({ data, canEdit, onSave }) {
  const [forecasts, setForecasts] = useState(data.forecasts || []);
  const prevJson = useRef(JSON.stringify(data.forecasts||[]));
  useEffect(()=>{const json=JSON.stringify(data.forecasts||[]);if(json!==prevJson.current){prevJson.current=json;setForecasts(data.forecasts||[]);}},[data.forecasts]);
  const debouncedSave = useDebouncedCallback(onSave, 800);
  const updForecast = (id,field,val) => {
    setForecasts(prev=>{const next=prev.map(f=>f.id===id?{...f,[field]:val}:f);const row=next.find(f=>f.id===id);if(row) debouncedSave("forecasts",row);return next;});
  };
  const M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const byY={};forecasts.forEach(f=>{if(!byY[f.year])byY[f.year]=[];byY[f.year].push(f);});
  return (
    <div className="space-y-8">
      <p className="text-sm text-[var(--text-muted)]">Monthly install forecasts vs actuals for <strong className="text-[var(--text)]">{data.fleet_name}</strong></p>
      {Object.entries(byY).sort(([a],[b])=>+a-+b).map(([yr,fs])=>{
        const s=fs.sort((a,b)=>a.month-b.month);
        return(<div key={yr}><h3 className="text-lg font-bold mb-3">{yr}</h3>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-auto"><table className="w-full text-sm"><thead><tr className="bg-blue-500/20/50">
            <th className="px-3 py-3 text-left text-xs text-[var(--text-secondary)] font-semibold w-24">Type</th>
            {s.map(f=><th key={f.month} className="px-1 py-3 text-center text-xs text-[var(--text-secondary)] font-semibold">{M[f.month-1]}</th>)}
            <th className="px-3 py-3 text-center text-xs text-[var(--text-secondary)] font-semibold bg-blue-500/10">Total</th>
          </tr></thead><tbody>
            <tr className="border-t border-[var(--border)]/50"><td className="px-3 py-2 text-amber-400 font-medium text-xs">Forecast</td>
              {s.map(f=><td key={f.month} className="px-1 py-2 text-center"><InstallNumInput value={f.forecasted} onSave={v=>updForecast(f.id,"forecasted",v)} disabled={!canEdit}/></td>)}
              <td className="px-3 py-2 text-center font-bold text-amber-400 bg-blue-500/5">{s.reduce((a,f)=>a+(f.forecasted||0),0)}</td>
            </tr>
            <tr className="border-t border-[var(--border)]/50"><td className="px-3 py-2 text-emerald-400 font-medium text-xs">Actual</td>
              {s.map(f=><td key={f.month} className="px-1 py-2 text-center"><InstallNumInput value={f.actual} onSave={v=>updForecast(f.id,"actual",v)} disabled={!canEdit}/></td>)}
              <td className="px-3 py-2 text-center font-bold text-emerald-400 bg-blue-500/5">{s.reduce((a,f)=>a+(f.actual||0),0)}</td>
            </tr>
          </tbody></table></div></div>);
      })}
    </div>
  );
}

function StatsTab({ data }) {
  const ov = data.overview || {};
  const contacts = data.contacts || [];
  const execSponsor = contacts.find(c => c.contact_type === "fleet" && c.role_title?.toLowerCase().includes("sponsor"));
  const fleetSummary = data.fleet_name
    ? `${data.fleet_name} is a fleet located in ${ov.hq_location || "—"}. Their Executive Sponsor is ${execSponsor?.name || "—"} (${execSponsor?.title || "—"}). Platform: ${ov.ps_platform || "—"}. Fleet Size: ${ov.fleet_size_label || "—"}.`
    : "No fleet data yet.";

  const items=[
    {l:"Marketplace Apps",v:data.stats.marketplace_apps,c:"text-blue-400"},
    {l:"User Provided Apps",v:data.stats.upas,c:"text-cyan-400"},
    {l:"Forms",v:data.stats.forms,c:"text-emerald-400"},
    {l:"Gaps Identified",v:data.stats.gaps,c:"text-amber-400"},
    {l:"Features Needed",v:data.stats.features_needed,c:"text-violet-400"},
  ];
  const formCats = data.stats.form_categories || {};
  const catLabels = ["All","Fleet Type","Customer/Consignee","Shipper","Terminal","Border Crossing","Other"];
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
        <p className="text-sm text-blue-200">{fleetSummary}</p>
      </div>
      <div className="grid grid-cols-3 lg:grid-cols-5 gap-4">{items.map(s=>(
        <div key={s.l} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
          <div className={`text-4xl font-bold mb-2 ${s.c}`}>{s.v}</div>
          <div className="text-sm text-[var(--text-muted)]">{s.l}</div>
        </div>))}</div>
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-4">Form Category Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {catLabels.map(cat => (
            <div key={cat} className="flex justify-between py-2 px-3 border border-[var(--border)]/30 rounded-lg">
              <span className="text-[var(--text-secondary)] text-sm">{cat}</span>
              <span className="text-[var(--text)] font-bold text-sm">{formCats[cat] || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SharingTab({ data, scopeId }) {
  const [invEmail,setInvEmail]=useState("");
  const [invRole,setInvRole]=useState("viewer");
  const [copied,setCopied]=useState(false);
  const isOwner=data.role==="owner";
  const shareUrl=data.share_token?`${typeof window!=="undefined"?window.location.origin:""}/share/${data.share_token}`:null;
  const enableShare=async()=>{await fetch(`/api/scopes/${scopeId}/share`,{method:"POST"});window.location.reload();};
  const disableShare=async()=>{await fetch(`/api/scopes/${scopeId}/share`,{method:"DELETE"});window.location.reload();};
  const invEmailValid = isValidEmail(invEmail) && invEmail.length > 0;
  const invite=async()=>{if(!invEmailValid)return;const r=await fetch(`/api/scopes/${scopeId}/collaborators`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:invEmail,role:invRole})});if(r.ok){setInvEmail("");window.location.reload();}else{const d=await r.json();alert(d.error);}};
  const remove=async(uid)=>{await fetch(`/api/scopes/${scopeId}/collaborators`,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:uid})});window.location.reload();};
  const copyLink=()=>{if(shareUrl){navigator.clipboard.writeText(shareUrl);setCopied(true);setTimeout(()=>setCopied(false),2000);}};
  const rc={owner:"text-blue-400 bg-blue-500/10 border-blue-500/20",editor:"text-emerald-400 bg-emerald-500/10 border-emerald-500/20",viewer:"text-amber-400 bg-amber-500/10 border-amber-500/20"};
  return (
    <div className="space-y-8">
      <div><h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Share Link (for Salesforce)</h3>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6">
          {data.share_access!=="disabled"&&shareUrl ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg font-mono text-sm text-cyan-400 truncate">{shareUrl}</div>
                <button onClick={copyLink} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-[var(--text)] text-sm font-medium flex items-center gap-2">{copied?<Check className="w-4 h-4"/>:<Copy className="w-4 h-4"/>}{copied?"Copied!":"Copy"}</button>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Paste this URL into Salesforce. Anyone with the link can view this scope.</p>
              {isOwner&&<button onClick={disableShare} className="text-xs text-red-400">Disable sharing</button>}
            </div>
          ) : (
            <div className="text-center py-4">
              <Link2 className="w-8 h-8 mx-auto mb-3 text-[#2a3a55]"/>
              <p className="text-sm text-[var(--text-muted)] mb-4">Sharing disabled. Generate a link to share in Salesforce.</p>
              {isOwner&&<button onClick={enableShare} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-[var(--text)] rounded-lg text-sm font-medium">Generate Share Link</button>}
            </div>
          )}
        </div>
      </div>
      <div><h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Team Members</h3>
        {isOwner&&<div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <input value={invEmail} onChange={e=>setInvEmail(e.target.value)} placeholder="Email address" className={`w-full px-4 py-2.5 bg-[var(--bg-secondary)] border rounded-lg text-[var(--text)] text-sm placeholder-[var(--text-muted)] focus:outline-none ${invEmail && !isValidEmail(invEmail) ? "border-red-500 focus:border-red-500" : "border-[var(--border)] focus:border-blue-500"}`}/>
            {invEmail && !isValidEmail(invEmail) && <span className="absolute -bottom-4 left-1 text-[10px] text-red-400">Invalid email address</span>}
          </div>
          <select value={invRole} onChange={e=>setInvRole(e.target.value)} className="px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm"><option value="viewer">Viewer</option><option value="editor">Editor</option></select>
          <button onClick={invite} disabled={!invEmailValid} className={`px-5 py-2.5 rounded-lg text-sm font-medium ${invEmailValid ? "bg-blue-600 hover:bg-blue-500 text-[var(--text)]" : "bg-blue-600/30 text-[var(--text-muted)] cursor-not-allowed"}`}>Invite</button>
        </div>}
        <div className="space-y-2">{data.collaborators.map(c=>(
          <div key={c.id} className="flex items-center justify-between bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-3">
            <div><span className="text-[var(--text)] font-medium text-sm">{c.name}</span><span className="text-[var(--text-muted)] text-sm ml-2">{c.email}</span></div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded border font-semibold uppercase ${rc[c.role]}`}>{c.role}</span>
              {isOwner&&c.role!=="owner"&&<button onClick={()=>remove(c.user_id)} className="text-red-400"><X className="w-4 h-4"/></button>}
            </div>
          </div>))}</div>
      </div>
    </div>
  );
}

function SummaryTab({ data, onNavigate }) {
  const ov = data.overview || {};
  const contacts = data.contacts || [];
  const execSponsorContact = contacts.find(c => c.contact_type === "fleet" && c.role_title?.toLowerCase().includes("sponsor"));
  const execSponsorName = ov.executive_sponsor_name || execSponsorContact?.name;
  const execSponsorTitle = ov.executive_sponsor_title || execSponsorContact?.title;
  const summaryParts = [];
  if (data.fleet_name) {
    summaryParts.push(`${data.fleet_name} is a ${ov.fleet_size_label || ""} ${ov.type_of_operation || ""} ${ov.current_technology || ""} ${ov.fleet_persona || ""} fleet`);
    if (ov.hq_location) summaryParts.push(`located in ${ov.hq_location}`);
    if (execSponsorName) summaryParts.push(`Their Executive Sponsor is ${execSponsorName}${execSponsorTitle ? ` (${execSponsorTitle})` : ""}`);
    if (ov.account_executive) summaryParts.push(`Account Executive: ${ov.account_executive}`);
  }
  const fleetSentence = summaryParts.length > 0 ? summaryParts.join(". ") + "." : "";
  const tabs = [
    {id:"overview",label:"Overview",desc:"Fleet profile, TMS, technology, links",icon:Building2},
    {id:"contacts",label:"Contacts",desc:"PS team and fleet contacts",icon:Phone},
    {id:"marketplace",label:"Marketplace & UPAs",desc:"Apps and user-provided applications",icon:ShoppingBag},
    {id:"solution",label:"Solution Mix",desc:"Features and 3rd party integrations",icon:Puzzle},
    {id:"gaps",label:"Gaps",desc:"Pain points and blockers",icon:AlertTriangle},
    {id:"workshop",label:"Presale Workshop",desc:"Discovery questions and responses",icon:MessageSquare},
    {id:"workflow",label:"Workflow Integration",desc:"Workflow integration details",icon:Workflow},
    {id:"install",label:"Install Strategy",desc:"Monthly install forecasts",icon:Calendar},
    {id:"sf_lookup",label:"Marketplace SF Lookup",desc:"Salesforce product catalog",icon:ShoppingBag},
    {id:"km_lookup",label:"KM Marketplace Lookup",desc:"Knowledge Management app catalog",icon:ShoppingBag},
    {id:"master_data",label:"Master Data",desc:"Global reference data for dropdowns",icon:Database},
    {id:"training",label:"Training",desc:"Training assessment Q&A",icon:GraduationCap},
    {id:"stats",label:"Stats",desc:"Auto-computed aggregations",icon:BarChart3},
  ];
  return (
    <div className="space-y-8">
      <FleetSummary data={data}/>
      {fleetSentence && (
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-sm text-blue-200">{fleetSentence}</p>
        </div>
      )}
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Platform</h3>
        <p className="text-lg font-bold text-[var(--text)]">{ov.ps_platform || "—"}</p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Tab Navigation & Data Flow</h3>
        <div className="space-y-2">
          {tabs.map(t=>{const I=t.icon; return(
            <button key={t.id} onClick={()=>onNavigate(t.id)} className="w-full text-left bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4 hover:border-blue-500/40 hover:bg-[var(--bg-card)] transition group">
              <div className="flex items-center gap-3">
                <I className="w-5 h-5 text-blue-400 flex-shrink-0"/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--text)] text-sm">{t.label}</span>
                    <span className="text-xs text-[var(--text-muted)]">— {t.desc}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#2a3a55] group-hover:text-blue-400 transition"/>
              </div>
            </button>
          );})}
        </div>
      </div>
      {/* RACI Matrix (START HERE rows 6-20) */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">RACI Matrix</h3>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-auto">
          <table className="w-full text-xs">
            <thead><tr className="bg-blue-500/20/50">
              {["Tab","R(esponsible)","A(ccountable)","C(onsulted)","I(nformed)"].map(h=>(
                <th key={h} className="text-left px-3 py-2.5 text-[var(--text-secondary)] font-semibold">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {[
                {tab:"Overview",R:"AE",A:"AE",C:"Customer",I:"SE, SAE, PMO, IMP"},
                {tab:"Contacts",R:"AE, PMO",A:"AE",C:"Customer",I:"SE, CSM, FE, SAE"},
                {tab:"Marketplace",R:"AE, SE, IMP",A:"IMP",C:"Customer, MKT",I:"PMO, SUP, TSA"},
                {tab:"Solution Mix",R:"AE, SE",A:"SE",C:"Customer",I:"SAE, PMO, IMP"},
                {tab:"Gaps",R:"AE, SE",A:"SE",C:"Customer",I:"SAE, PMO, IMP"},
                {tab:"Workshop",R:"SE, INT",A:"SE",C:"Customer",I:"AE, IMP, PMO"},
                {tab:"Forms",R:"SE, IMP",A:"SE",C:"Customer",I:"AE, PMO, INT"},
                {tab:"WF/Integration",R:"IMP, INT",A:"IMP",C:"Customer",I:"PMO, SUP, SAE"},
                {tab:"Install Strategy",R:"IMP, PMO, FE",A:"PMO",C:"Customer",I:"AE, SE, SUP"},
                {tab:"SF Lookup",R:"MKT",A:"MKT",C:"MKT",I:"AE, SE, SAE"},
                {tab:"Training",R:"TAM, PMO",A:"TAM",C:"MKT, AE",I:"SAE, IMP, CSM"},
              ].map(r=>(
                <tr key={r.tab} className="border-t border-[var(--border)]/30 hover:bg-[var(--bg-card)]">
                  <td className="px-3 py-2 text-[var(--text)] font-medium">{r.tab}</td>
                  <td className="px-3 py-2 text-emerald-400">{r.R}</td>
                  <td className="px-3 py-2 text-amber-400">{r.A}</td>
                  <td className="px-3 py-2 text-cyan-400">{r.C}</td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">{r.I}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Role Definitions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {[{id:"AE",n:"Account Executive"},{id:"SE",n:"Solutions Engineer"},{id:"SAE",n:"Solutions Architect"},{id:"PMO",n:"Program Management"},{id:"INT",n:"Integrations"},{id:"IMP",n:"Implementer"},{id:"CSM",n:"Customer Success Manager"},{id:"MKT",n:"Marketplace"},{id:"FE",n:"Field Engineer"},{id:"AM",n:"Account Manager"},{id:"TAM",n:"Training Account Manager"},{id:"TSA",n:"Tech Solution Architect"},{id:"SUP",n:"Support"},{id:"Customer",n:"Customer"}].map(r=>(
            <div key={r.id} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{r.id}</span>
                <span className="text-xs text-[var(--text)] font-medium">{r.n}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlaceholderTab({ title, desc }) {
  return <div className="text-center py-16"><ClipboardList className="w-12 h-12 mx-auto mb-4 text-[#2a3a55]"/><h3 className="text-lg font-semibold mb-2">{title}</h3><p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">{desc}</p></div>;
}

// ═══ MAIN PAGE ═══
export default function ScopePage() {
  const params = useParams();
  const router = useRouter();
  const scopeId = params.id;
  const [data,setData] = useState(null);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [saved,setSaved] = useState(false);
  const [tab,setTab] = useState("summary");
  const [err,setErr] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({});

  const { toast } = useToast();
  const canEdit = data?.role==="owner"||data?.role==="editor";
  const [refData, setRefData] = useState({});
  const [completionData, setCompletionData] = useState(null);
  const [completionConfig, setCompletionConfig] = useState({});

  const load = useCallback(async()=>{
    const r=await fetch(`/api/scopes/${scopeId}`);
    if(!r.ok){setErr("Not found or no access");setLoading(false);return;}
    setData(await r.json());setLoading(false);
  },[scopeId]);

  const loadRef = useCallback(async()=>{
    const r=await fetch("/api/ref?table=masterdata");
    if(r.ok){const d=await r.json();const mapped={};for(const[cat,items]of Object.entries(d.data||{})){mapped[cat]=(items||[]).map(i=>i.value);}setRefData(mapped);}
  },[]);

  const loadCompletion = useCallback(async()=>{
    try{const r=await fetch(`/api/scopes/completion`);if(r.ok){const all=await r.json();if(all[scopeId]) setCompletionData(all[scopeId]);}}catch{}
  },[scopeId]);

  const loadCompletionConfig = useCallback(async()=>{
    try{const r=await fetch("/api/admin/completion-config");if(r.ok){setCompletionConfig(await r.json());}}catch{}
  },[]);

  useEffect(()=>{load();},[load]);
  useEffect(()=>{loadRef();},[loadRef]);
  useEffect(()=>{if(tab==="overview") loadRef();},[tab, loadRef]);
  useEffect(()=>{loadCompletion();},[loadCompletion]);
  useEffect(()=>{loadCompletionConfig();},[loadCompletionConfig]);

  const [saveErr,setSaveErr] = useState("");
  const save = async(section,d,action)=>{
    setSaving(true);setSaveErr("");
    const r=await fetch(`/api/scopes/${scopeId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({section,data:d,action})});
    setSaving(false);
    if(r.ok){
      setSaved(true);setTimeout(()=>setSaved(false),2000);
      // Re-fetch for structural changes and overview saves (so cross-tab data stays fresh).
      // Skip reload for other inline edits to avoid resetting input state mid-typing.
      if(action==="delete"||action==="bulk"||(!action && !d.id)||section==="overview"){await load();}
      loadCompletion();
    }
    else{const e=await r.json().catch(()=>({}));const msg=e.error||"Save failed";setSaveErr(msg);toast(msg,"error");setTimeout(()=>setSaveErr(""),5000);}
    return r.ok;
  };

  if(loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"/></div>;
  if(err||!data) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><p className="text-red-400 mb-4">{err}</p><button onClick={()=>router.push("/dashboard")} className="text-blue-400">← Dashboard</button></div></div>;

  // Helper to get required/missing fields for a tab
  const getTabFieldProps = (tabKey) => {
    const cfg = completionConfig[tabKey];
    const cd = completionData?.tabs?.[tabKey];
    return {
      requiredFields: cfg?.required_fields || [],
      missingFields: cd?.missingFields || [],
    };
  };

  const renderTab = () => {
    switch(tab){
      case "summary": return <SummaryTab data={data} onNavigate={setTab}/>;
      case "overview": return <OverviewTab data={data} canEdit={canEdit} onSave={save} refData={refData} {...getTabFieldProps("overview")}/>;
      case "contacts": return <ContactsTab data={data} canEdit={canEdit} onSave={save} {...getTabFieldProps("contacts")}/>;
      case "marketplace": return <MarketplaceTab data={data} canEdit={canEdit} onSave={save} {...getTabFieldProps("marketplace")}/>;
      case "solution": return <><SolutionTab data={data} canEdit={canEdit} onSave={save} {...getTabFieldProps("solution")}/><SolutionLinkedSection data={data}/></>;
      case "gaps": return <GapsTab data={data} canEdit={canEdit} onSave={save} {...getTabFieldProps("gaps")}/>;
      case "install": return <InstallTab data={data} canEdit={canEdit} onSave={save} {...getTabFieldProps("install")}/>;
      case "stats": return <StatsTab data={data}/>;
      case "sharing": return <SharingTab data={data} scopeId={scopeId}/>;
      case "workshop": return <WorkshopTabComp data={data} canEdit={canEdit} onSave={save}/>;
      case "training": return <TrainingTabComp data={data} canEdit={canEdit} onSave={save}/>;
      case "workflow": return <WorkflowTabComp data={data} canEdit={canEdit} onSave={save}/>;
      case "sf_lookup": return <SFLookupTab/>;
      case "km_lookup": return <KMLookupTab/>;
      case "master_data": return <MasterDataTab/>;
      case "forms": return <FormsTabComp data={data} canEdit={canEdit} onSave={save}/>;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 flex">
      <aside className="w-60 flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg-secondary)] h-full overflow-y-auto">
        <div className="p-4 border-b border-[var(--border)]">
          <button onClick={()=>router.push("/dashboard")} className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition mb-3"><ArrowLeft className="w-4 h-4"/> Dashboard</button>
          <h2 className="font-bold text-[var(--text)] truncate">{data.fleet_name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${data.status==="active"?"text-emerald-400 bg-emerald-500/10 border-emerald-500/20":"text-amber-400 bg-amber-500/10 border-amber-500/20"}`}>{data.status}</span>
            <span className={`text-[10px] font-bold uppercase ${data.role==="owner"?"text-blue-400":data.role==="editor"?"text-emerald-400":"text-amber-400"}`}>{data.role}</span>
          </div>
        </div>
        <nav className="py-2">{TABS.map(t=>{const I=t.icon;const hasChildren=t.children&&t.children.length;const isExpanded=expandedGroups[t.id]||false;const childActive=hasChildren&&t.children.some(c=>c.id===tab);return(
          <div key={t.id}>
            <button onClick={()=>{if(hasChildren){setExpandedGroups(p=>({...p,[t.id]:!p[t.id]}));if(!isExpanded&&!childActive)setTab(t.id);}else{setTab(t.id);}}} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition border-l-2 ${tab===t.id||childActive?"bg-blue-500/10 text-blue-400 border-l-blue-400 font-semibold":"text-[var(--text-muted)] hover:text-[var(--text)] border-l-transparent"}`}><I className="w-4 h-4 flex-shrink-0"/><span className="flex-1 text-left">{t.label}</span>{completionData?.tabs?.[t.id]!==undefined&&completionData.tabs[t.id].total>0&&<CompletionDot percent={completionData.tabs[t.id].percent}/>}{hasChildren&&<ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded||childActive?"rotate-0":"rotate-[-90deg]"}`}/>}</button>
            {hasChildren&&(isExpanded||childActive)&&t.children.map(c=>(
              <button key={c.id} onClick={()=>setTab(c.id)} className={`w-full flex items-center gap-3 pl-11 pr-4 py-2 text-xs transition border-l-2 ${tab===c.id?"bg-blue-500/10 text-blue-400 border-l-blue-400 font-semibold":"text-[var(--text-muted)] hover:text-[var(--text)] border-l-transparent"}`}>{c.label}</button>
            ))}
          </div>
        );})}</nav>
      </aside>
      <main className="flex-1 min-w-0 h-full flex flex-col">
        <div className="flex-shrink-0 bg-[var(--bg)] border-b border-[var(--border)]">
          <div className="px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="font-bold text-lg">{TABS.find(t=>t.id===tab)?.label || TABS.flatMap(t=>t.children||[]).find(c=>c.id===tab)?.label}</h1>
              {saving&&<span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded animate-pulse flex items-center gap-1"><span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin inline-block"/> Saving...</span>}
              {saved&&<span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1 animate-[fadeOut_0.5s_ease-in_1.5s_forwards]"><Check className="w-3 h-3"/> Saved</span>}
              {saveErr&&<span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Error saving</span>}
              {!saving&&!saved&&!saveErr&&canEdit&&<span className="text-[10px] text-[var(--text-muted)]">Changes save automatically</span>}
              <style>{`@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }`}</style>
            </div>
            <div className="flex items-center gap-3">
              {!canEdit&&<span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full" title="Contact the document owner for edit access">Read Only — contact owner for edit access</span>}
              <ThemeToggle />
              <a href={`/api/scopes/${scopeId}/export`} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-600/30 transition-colors"><Download className="w-3.5 h-3.5"/> Export Excel</a>
            </div>
          </div>
          {completionData && (
            <div className="px-8 pb-2 max-w-5xl">
              <CompletionBar percent={completionData.overall} size="md" showLabel label="Scope Completion" />
            </div>
          )}
          {completionData?.tabs?.[tab] && completionData.tabs[tab].total > 0 && (
            <div className="px-8 pb-3 max-w-5xl">
              <p className="text-xs text-[var(--text-muted)]">
                {TABS.find(t=>t.id===tab)?.label || tab}: <span className={`font-semibold ${completionData.tabs[tab].percent>=100?"text-emerald-400":completionData.tabs[tab].percent>=67?"text-cyan-400":completionData.tabs[tab].percent>=34?"text-amber-400":"text-rose-400"}`}>{completionData.tabs[tab].percent}% complete</span> — {completionData.tabs[tab].filled} of {completionData.tabs[tab].total} required items filled
                {completionData.tabs[tab].missingFields.length > 0 && (
                  <span className="text-[var(--text-muted)]"> (missing: {completionData.tabs[tab].missingFields.slice(0,5).join(", ")}{completionData.tabs[tab].missingFields.length>5?` +${completionData.tabs[tab].missingFields.length-5} more`:""})</span>
                )}
              </p>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-8 max-w-5xl">{renderTab()}</div>
      </main>
    </div>
  );
}
