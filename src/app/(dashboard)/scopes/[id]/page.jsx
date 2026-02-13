"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Users, Copy, X, Plus, Trash2, Building2, Phone, ShoppingBag, Puzzle, AlertTriangle, MessageSquare, GraduationCap, ClipboardList, Workflow, Calendar, BarChart3, Check, Link2, Home, Database, Download, ChevronDown } from "lucide-react";
import { FleetSummary, CrossTabBanner } from "@/components/scope/CrossTabBanner";
import WorkflowTabComp from "@/components/scope/WorkflowTab";
import WorkshopTabComp from "@/components/scope/WorkshopTab";
import SolutionLinkedSection from "@/components/scope/SolutionLinkedSection";
import { SFLookupTab, KMLookupTab } from "@/components/scope/MarketplaceLookupTab";
import TrainingTabComp from "@/components/scope/TrainingTab";
import FormsTabComp from "@/components/scope/FormsTab";
import MasterDataTab from "@/components/scope/MasterDataTab";
import CityAutocomplete from "@/components/scope/CityAutocomplete";

function formatPhone(value) {
  const digits = (value||'').replace(/\D/g,'').slice(0,10);
  if(!digits) return '';
  if(digits.length<=3) return `(${digits}`;
  if(digits.length<=6) return `(${digits.slice(0,3)})-${digits.slice(3)}`;
  return `(${digits.slice(0,3)})-${digits.slice(3,6)}-${digits.slice(6)}`;
}

function ContactInlineInput({val,onChange,dis,bold,sz}) {
  return <input className={`bg-transparent border-none ${bold?"text-white":"text-[#94a3b8]"} text-sm ${sz?"":"w-full"} focus:outline-none`} value={val||""} onChange={e=>onChange(e.target.value)} disabled={dis} placeholder="—" {...(sz?{size:sz}:{})}/>;
}

function ContactPhoneInput({val,onChange,dis}) {
  return <input className="bg-transparent border-none text-[#94a3b8] text-sm focus:outline-none" value={formatPhone(val)} onChange={e=>onChange(formatPhone(e.target.value))} disabled={dis} placeholder="(000)-000-0000" size={14}/>;
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
  { id: "master_data", label: "MasterData", icon: Database, children: [
    { id: "sf_lookup", label: "SF Lookup" },
    { id: "km_lookup", label: "KM Lookup" },
  ]},
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "sharing", label: "Sharing & Team", icon: Users },
];

function Field({ label, value, onChange, disabled, type="text", options, placeholder, wide }) {
  const cls = "w-full px-3 py-2 bg-[#111827] border border-[#2a3a55] rounded-lg text-white text-sm placeholder-[#4a5568] focus:outline-none focus:border-blue-500 transition disabled:opacity-50";
  return (
    <div className={wide?"col-span-2":""}>
      <label className="block text-xs font-medium text-[#64748b] mb-1.5 uppercase tracking-wider">{label}</label>
      {type==="select"&&options ? <select value={value||""} onChange={e=>onChange(e.target.value)} disabled={disabled} className={cls}><option value="">— Select —</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>
      : type==="textarea" ? <textarea value={value||""} onChange={e=>onChange(e.target.value)} disabled={disabled} rows={3} className={cls} placeholder={placeholder}/>
      : type==="number" ? <input type="number" value={value??""} onChange={e=>onChange(e.target.value?parseInt(e.target.value):null)} disabled={disabled} className={cls} placeholder={placeholder}/>
      : type==="checkbox" ? <button type="button" onClick={()=>!disabled&&onChange(value?0:1)} disabled={disabled} className={`w-6 h-6 rounded border ${value?"bg-blue-600 border-blue-500":"bg-[#111827] border-[#2a3a55]"} flex items-center justify-center`}>{value?<Check className="w-4 h-4 text-white"/>:null}</button>
      : <input type={type} value={value||""} onChange={e=>onChange(e.target.value)} disabled={disabled} className={cls} placeholder={placeholder}/>}
    </div>
  );
}

function OverviewTab({ data, canEdit, onSave }) {
  const today = new Date().toISOString().split('T')[0];
  const initOv = (o) => ({...o, date_lead_provided: o?.date_lead_provided || today});
  const [ov, setOv] = useState(initOv(data.overview||{}));
  const set = (k,v) => setOv(p=>({...p,[k]:v}));
  useEffect(()=>{setOv(initOv(data.overview||{}))},[data.overview]);
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-5">
        <p className="text-sm text-blue-300 font-medium">{data.fleet_name} is a {ov.fleet_size_label||"—"} {ov.type_of_operation||"—"} {ov.current_technology||"—"} {ov.fleet_persona||"—"} fleet</p>
        <p className="text-xs text-[#64748b] mt-1">↑ Auto-computed summary (mirrors START HERE tab)</p>
      </div>
      <section><h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">Fleet Profile</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fleet Name" value={ov.fleet_name??data.fleet_name} onChange={v=>set("fleet_name",v)} disabled={!canEdit}/>
          <CityAutocomplete label="HQ Location" value={ov.hq_location} onChange={v=>set("hq_location",v)} onCitySelect={(city)=>{set("hq_location",`${city.city}, ${city.state}`);set("fleet_timezone",city.timezone);}} disabled={!canEdit} placeholder="City, ST"/>
          <Field label="PS Platform" value={ov.ps_platform} onChange={v=>set("ps_platform",v)} disabled={!canEdit} type="select" options={["PS Enterprise","PS+"]}/>
          <Field label="Fleet Timezone" value={ov.fleet_timezone} onChange={v=>set("fleet_timezone",v)} disabled={!canEdit} type="select" options={["Eastern","Central","Mountain","Pacific","Alaska","Hawaii"]}/>
          <Field label="Current Technology" value={ov.current_technology} onChange={v=>set("current_technology",v)} disabled={!canEdit} type="select" options={["Pre-Mobility","Mobility"]}/>
          <Field label="Fleet Persona" value={ov.fleet_persona} onChange={v=>set("fleet_persona",v)} disabled={!canEdit} type="select" options={["Innovator","Early Adopter","Early Majority","Late Majority","Influencer"]}/>
          <Field label="Type of Company" value={ov.type_of_company} onChange={v=>set("type_of_company",v)} disabled={!canEdit} type="select" options={["Private Fleet/Shipper","Brokerage/3PL","Maintenance Service Center","Fuel/Energy","Autohauler"]}/>
          <Field label="Type of Operation" value={ov.type_of_operation} onChange={v=>set("type_of_operation",v)} disabled={!canEdit} type="select" options={["General Freight","Reefer","LTL","Retail/Wholesale","Bulk/Petrol/Chem/Tanker","Intermodal"]}/>
        </div>
      </section>
      <section><h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">Fleet Size</h3>
        <div className="grid grid-cols-3 gap-4">
          <Field label="# Drivers" value={ov.num_drivers} onChange={v=>set("num_drivers",v)} disabled={!canEdit} type="number"/>
          <Field label="# Tractors" value={ov.num_tractors} onChange={v=>set("num_tractors",v)} disabled={!canEdit} type="number"/>
          <Field label="# Trailers" value={ov.num_trailers} onChange={v=>set("num_trailers",v)} disabled={!canEdit} type="number"/>
        </div>
      </section>
      <section><h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">TMS & Technology</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Current TSP" value={ov.current_tsp} onChange={v=>set("current_tsp",v)} disabled={!canEdit} placeholder="e.g. Omni"/>
          <Field label="Current TMS" value={ov.current_tms} onChange={v=>set("current_tms",v)} disabled={!canEdit} placeholder="e.g. McLeod"/>
          <Field label="Current TMS Type" value={ov.current_tms_type} onChange={v=>set("current_tms_type",v)} disabled={!canEdit} type="select" options={["Cloud","Hosted","SaaS","On-Prem"]}/>
          <Field label="Current TMS Version" value={ov.current_tms_version} onChange={v=>set("current_tms_version",v)} disabled={!canEdit}/>
          <Field label="Future TMS" value={ov.future_tms} onChange={v=>set("future_tms",v)} disabled={!canEdit}/>
          <Field label="Future TMS Type" value={ov.future_tms_type} onChange={v=>set("future_tms_type",v)} disabled={!canEdit} type="select" options={["Cloud","Hosted","SaaS","On-Prem"]}/>
        </div>
      </section>
      <section><h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">Links & References</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Account Executive" value={ov.account_executive} onChange={v=>set("account_executive",v)} disabled={!canEdit}/>
          <Field label="Date Lead Provided" value={ov.date_lead_provided} onChange={v=>set("date_lead_provided",v)} disabled={!canEdit} type="date"/>
          <Field label="Contract Link" value={ov.contract_link} onChange={v=>set("contract_link",v)} disabled={!canEdit} placeholder="URL"/>
          <Field label="SF Opportunity Link" value={ov.sf_opportunity_link} onChange={v=>set("sf_opportunity_link",v)} disabled={!canEdit} placeholder="URL"/>
          <Field label="Master Notes" value={ov.master_notes_link} onChange={v=>set("master_notes_link",v)} disabled={!canEdit} placeholder="URL"/>
          <Field label="Customer Dossier" value={ov.customer_dossier_link} onChange={v=>set("customer_dossier_link",v)} disabled={!canEdit} placeholder="URL"/>
        </div>
      </section>
      {/* Hardware Overview (rows 47-58) */}
      <section><h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">Hardware Overview</h3>
        <div className="bg-[#111827] border border-[#2a3a55] rounded-xl overflow-auto">
          <table className="w-full text-sm"><thead><tr className="bg-[#1e3a5f]/50">
            {["Item","Type","SKU","Expected Amount","Notes"].map(h=><th key={h} className="text-left px-4 py-3 text-xs text-[#94a3b8] font-semibold">{h}</th>)}
          </tr></thead><tbody>
            {(()=>{let hw=[];try{hw=JSON.parse(ov.hardware_json||"[]")}catch{}
              if(!hw.length) hw=["Tablets","OBC (PS+)","Ball","Arms","Knox Provisioning","CVDs","Cable 1","Cable 2","Cable 3","Cable 4"].map(n=>({name:n,type:"",sku:"",amount:"",notes:""}));
              return hw.map((h,i)=>(
                <tr key={i} className="border-t border-[#2a3a55]/50 hover:bg-[#1a2234]">
                  <td className="px-4 py-2 text-white font-medium text-xs">{h.name}</td>
                  {["type","sku","amount","notes"].map(f=>(
                    <td key={f} className="px-4 py-1"><input className="w-full bg-transparent text-[#94a3b8] text-xs focus:outline-none" value={h[f]||""} onChange={e=>{const up=[...hw];up[i]={...up[i],[f]:e.target.value};set("hardware_json",JSON.stringify(up))}} disabled={!canEdit} placeholder="—"/></td>
                  ))}
                </tr>))})()}
          </tbody></table>
        </div>
      </section>
      {/* Vehicle Breakdown (rows 59-91) */}
      <section><h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">Vehicle Breakdown</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Vehicle List Link" value={ov.vehicle_list_link} onChange={v=>set("vehicle_list_link",v)} disabled={!canEdit} placeholder="URL"/>
        </div>
        <div className="bg-[#111827] border border-[#2a3a55] rounded-xl overflow-auto">
          <table className="w-full text-sm"><thead><tr className="bg-[#1e3a5f]/50">
            {["How Many?","Year","Make","Model"].map(h=><th key={h} className="text-left px-4 py-3 text-xs text-[#94a3b8] font-semibold">{h}</th>)}
            {canEdit&&<th className="w-10"/>}
          </tr></thead><tbody>
            {(()=>{let veh=[];try{veh=JSON.parse(ov.vehicles_json||"[]")}catch{}
              return veh.length?veh.map((v,i)=>(
                <tr key={i} className="border-t border-[#2a3a55]/50">
                  {["count","year","make","model"].map(f=>(
                    <td key={f} className="px-4 py-1">{f==="make"?
                      <select className="bg-transparent text-white text-xs focus:outline-none" value={v.make||""} onChange={e=>{const up=[...veh];up[i]={...up[i],make:e.target.value};set("vehicles_json",JSON.stringify(up))}} disabled={!canEdit}>
                        <option value="">—</option>{["International","Freightliner","Kenworth","Hino","Peterbilt","Volvo"].map(m=><option key={m}>{m}</option>)}
                      </select>:
                      <input className="w-full bg-transparent text-[#94a3b8] text-xs focus:outline-none" value={v[f]||""} onChange={e=>{const up=[...veh];up[i]={...up[i],[f]:e.target.value};set("vehicles_json",JSON.stringify(up))}} disabled={!canEdit}/>}
                    </td>))}
                  {canEdit&&<td><button onClick={()=>{const up=veh.filter((_,j)=>j!==i);set("vehicles_json",JSON.stringify(up))}} className="text-red-400/40 hover:text-red-400"><Trash2 className="w-3 h-3"/></button></td>}
                </tr>)):
                <tr><td colSpan={5} className="px-4 py-6 text-center text-[#4a5568] text-xs">No vehicles listed</td></tr>})()}
          </tbody></table>
        </div>
        {canEdit&&<button onClick={()=>{let veh=[];try{veh=JSON.parse(ov.vehicles_json||"[]")}catch{} veh.push({count:"",year:"",make:"",model:""});set("vehicles_json",JSON.stringify(veh))}} className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"><Plus className="w-3 h-3"/> Add Vehicle Row</button>}
      </section>
      {/* Fuel Haulers & Shipment Details (rows 92-109) */}
      <section><h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">Fuel Haulers & Shipment Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Do you have tankers?" value={ov.has_tankers} onChange={v=>set("has_tankers",v)} disabled={!canEdit} type="select" options={["Yes","No"]}/>
          <Field label="# of single compartments?" value={ov.single_compartments} onChange={v=>set("single_compartments",v)} disabled={!canEdit}/>
          <Field label="# of multiple compartments?" value={ov.multiple_compartments} onChange={v=>set("multiple_compartments",v)} disabled={!canEdit}/>
          <Field label="Rented or foreign trailers?" value={ov.rented_foreign_trailers} onChange={v=>set("rented_foreign_trailers",v)} disabled={!canEdit} type="select" options={["Rented","Foreign","Both"]}/>
          <Field label="Do you use containers?" value={ov.use_containers} onChange={v=>set("use_containers",v)} disabled={!canEdit} type="select" options={["Yes","No"]}/>
          <Field label="Do you use chassis?" value={ov.use_chassis} onChange={v=>set("use_chassis",v)} disabled={!canEdit} type="select" options={["Yes","No"]}/>
          <Field label="Handle parcel shipments?" value={ov.parcel_shipments} onChange={v=>set("parcel_shipments",v)} disabled={!canEdit} type="select" options={["Yes","No"]}/>
          <Field label="Handle multi-stop orders?" value={ov.multi_stop_orders} onChange={v=>set("multi_stop_orders",v)} disabled={!canEdit} type="select" options={["Yes","No"]}/>
          <Field label="Commodities hauled" value={ov.commodities_hauled} onChange={v=>set("commodities_hauled",v)} disabled={!canEdit} wide/>
          <Field label="Multi-mode transport?" value={ov.multi_mode_transport} onChange={v=>set("multi_mode_transport",v)} disabled={!canEdit} type="select" options={["Yes","No"]}/>
          <Field label="How handle split loads?" value={ov.split_loads} onChange={v=>set("split_loads",v)} disabled={!canEdit}/>
          <Field label="Multi-leg shipments?" value={ov.multi_leg_shipments} onChange={v=>set("multi_leg_shipments",v)} disabled={!canEdit} type="select" options={["Yes","No"]}/>
          <Field label="Freight via rail?" value={ov.freight_via_rail} onChange={v=>set("freight_via_rail",v)} disabled={!canEdit} type="select" options={["Yes","No"]}/>
          <Field label="Haul petroleum/liquids?" value={ov.petroleum_liquids} onChange={v=>set("petroleum_liquids",v)} disabled={!canEdit} type="select" options={["Yes","No"]}/>
          <Field label="Consolidate loads?" value={ov.consolidate_loads} onChange={v=>set("consolidate_loads",v)} disabled={!canEdit} type="select" options={["Yes","No"]}/>
          <Field label="Pick-up/drop-off process" value={ov.pickup_dropoff_process} onChange={v=>set("pickup_dropoff_process",v)} disabled={!canEdit} wide/>
        </div>
      </section>
      {canEdit && <button onClick={()=>onSave("overview",ov)} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition flex items-center gap-2"><Save className="w-4 h-4"/> Save Overview</button>}
    </div>
  );
}

function ContactsTab({ data, canEdit, onSave }) {
  const [contacts, setContacts] = useState(data.contacts || []);
  useEffect(() => { setContacts(data.contacts || []); }, [data.contacts]);

  const ps = contacts.filter(c=>c.contact_type==="ps_team");
  const fleet = contacts.filter(c=>c.contact_type==="fleet");

  const upd = (id,f,v) => setContacts(prev=>prev.map(c=>c.id===id?{...c,[f]:v}:c));

  return (
    <div className="space-y-8">
      <CrossTabBanner links={[
        {field: "Header banner", source: "Overview!C1"},
        {field: "Account Executive", source: "Overview!H3"},
      ]}/>
      {/* Contacts!B3 = Overview!H3 (AE name in header) */}
      {data.overview?.account_executive && (
        <div className="bg-[#111827] border border-[#2a3a55] rounded-xl p-3 flex items-center gap-3">
          <span className="text-[10px] text-[#64748b] uppercase tracking-wider">Account Executive:</span>
          <span className="text-sm text-white font-medium">{data.overview.account_executive}</span>
          <span className="text-[10px] text-cyan-400/60 font-mono ml-auto">← Overview!H3</span>
        </div>
      )}
      <div><h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">PS Team</h3>
        <div className="bg-[#111827] border border-[#2a3a55] rounded-xl overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-[#1e3a5f]/50">
          {["Role","Name","Email","Phone"].map(h=><th key={h} className="text-left px-4 py-3 text-xs text-[#94a3b8] font-semibold">{h}</th>)}
        </tr></thead><tbody>{ps.map(c=>(
          <tr key={c.id} className="border-t border-[#2a3a55]/50 hover:bg-[#1a2234]">
            <td className="px-4 py-2 text-blue-400 font-medium text-xs w-48">{c.role_title}:</td>
            <td className="px-4 py-2"><ContactInlineInput val={c.name} onChange={v=>upd(c.id,"name",v)} dis={!canEdit} bold sz={20}/></td>
            <td className="px-4 py-2"><ContactInlineInput val={c.email} onChange={v=>upd(c.id,"email",v)} dis={!canEdit} sz={20}/></td>
            <td className="px-4 py-2"><ContactPhoneInput val={c.phone} onChange={v=>upd(c.id,"phone",v)} dis={!canEdit}/></td>
          </tr>))}</tbody></table></div>
      </div>
      <div><div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">Fleet Contacts</h3>
        {canEdit&&<button onClick={()=>onSave("contacts",{contact_type:"fleet",role_title:"",name:"",sort_order:fleet.length})} className="flex items-center gap-1 text-xs text-blue-400"><Plus className="w-3.5 h-3.5"/> Add</button>}
      </div>
        <div className="bg-[#111827] border border-[#2a3a55] rounded-xl overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-[#1e3a5f]/50">
          {["Role","Name","Email","Phone"].map(h=><th key={h} className="text-left px-4 py-3 text-xs text-[#94a3b8] font-semibold">{h}</th>)}
          {canEdit&&<th className="w-10"/>}
        </tr></thead><tbody>
          {fleet.length===0?<tr><td colSpan={5} className="px-4 py-8 text-center text-[#4a5568] text-sm">No fleet contacts yet</td></tr>:
          fleet.map(c=>(
            <tr key={c.id} className="border-t border-[#2a3a55]/50 hover:bg-[#1a2234]">
              <td className="px-4 py-2"><ContactInlineInput val={c.role_title} onChange={v=>upd(c.id,"role_title",v)} dis={!canEdit} bold/></td>
              <td className="px-4 py-2"><ContactInlineInput val={c.name} onChange={v=>upd(c.id,"name",v)} dis={!canEdit} bold sz={20}/></td>
              <td className="px-4 py-2"><ContactInlineInput val={c.email} onChange={v=>upd(c.id,"email",v)} dis={!canEdit} sz={20}/></td>
              <td className="px-4 py-2"><ContactPhoneInput val={c.phone} onChange={v=>upd(c.id,"phone",v)} dis={!canEdit}/></td>
              {canEdit&&<td className="px-2"><button onClick={()=>onSave("contacts",{id:c.id},"delete")} className="p-1 hover:bg-red-500/10 rounded text-red-400"><Trash2 className="w-3.5 h-3.5"/></button></td>}
            </tr>))}
        </tbody></table></div>
      </div>
      {canEdit && <button onClick={()=>onSave("contacts",contacts,"bulk")} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition flex items-center gap-2"><Save className="w-4 h-4"/> Save Contacts</button>}
    </div>
  );
}

function SolutionTab({ data, canEdit, onSave }) {
  const toggle=(f,k)=>onSave("features",{...f,[k]:f[k]?0:1});
  const Chk=({val,c="blue"})=>(<div className={`w-5 h-5 rounded border mx-auto flex items-center justify-center ${val?`bg-${c}-600 border-${c}-500`:"bg-[#0a0e17] border-[#2a3a55]"}`}>{val?<Check className="w-3 h-3 text-white"/>:null}</div>);
  return (
    <div>
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4 mb-6"><p className="text-xs text-blue-300">↑ Platform: <strong>{data.overview?.ps_platform||"—"}</strong> (linked from Overview)</p></div>
      <div className="bg-[#111827] border border-[#2a3a55] rounded-xl overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-[#1e3a5f]/50">
        {["Feature","Needed","Licenses","Quote","Pilot","Prod","Notes"].map(h=><th key={h} className={`px-4 py-3 text-xs text-[#94a3b8] font-semibold ${h==="Feature"||h==="Notes"?"text-left":"text-center"} ${h!=="Feature"&&h!=="Notes"?"w-20":""}`}>{h}</th>)}
      </tr></thead><tbody>{data.features.map(f=>(
        <tr key={f.id} className="border-t border-[#2a3a55]/50 hover:bg-[#1a2234]">
          <td className="px-4 py-2 font-medium text-white">{f.feature_name}</td>
          <td className="px-4 py-2 text-center cursor-pointer" onClick={()=>canEdit&&toggle(f,"needed")}><Chk val={f.needed}/></td>
          <td className="px-4 py-2 text-center"><input type="number" className="w-14 bg-transparent border-none text-center text-[#94a3b8] text-sm focus:outline-none" value={f.num_licenses??""} onChange={e=>onSave("features",{...f,num_licenses:e.target.value?parseInt(e.target.value):null})} disabled={!canEdit}/></td>
          <td className="px-4 py-2 text-center cursor-pointer" onClick={()=>canEdit&&toggle(f,"required_for_quote")}><Chk val={f.required_for_quote} c="emerald"/></td>
          <td className="px-4 py-2 text-center cursor-pointer" onClick={()=>canEdit&&toggle(f,"required_for_pilot")}><Chk val={f.required_for_pilot} c="emerald"/></td>
          <td className="px-4 py-2 text-center cursor-pointer" onClick={()=>canEdit&&toggle(f,"required_for_production")}><Chk val={f.required_for_production} c="emerald"/></td>
          <td className="px-4 py-2"><input className="bg-transparent border-none text-[#94a3b8] text-sm w-full focus:outline-none" value={f.notes||""} onChange={e=>onSave("features",{...f,notes:e.target.value})} disabled={!canEdit} placeholder="—"/></td>
        </tr>))}</tbody></table></div>
    </div>
  );
}

function GapsTab({ data, canEdit, onSave }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#64748b]">Gaps or pain points identified during alignment.</p>
        {canEdit&&<button onClick={()=>onSave("gaps",{gap_number:data.gaps.length+1,sort_order:data.gaps.length})} className="flex items-center gap-1 text-xs text-blue-400"><Plus className="w-3.5 h-3.5"/> Add Gap</button>}
      </div>
      <div className="space-y-4">
        {data.gaps.length===0?<div className="text-center py-12 text-[#4a5568]">No gaps yet</div>:
        data.gaps.map((g,i)=>(
          <div key={g.id} className="bg-[#111827] border border-[#2a3a55] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded">Gap #{i+1}</span>
              {canEdit&&<button onClick={()=>onSave("gaps",{id:g.id},"delete")} className="text-red-400"><Trash2 className="w-4 h-4"/></button>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Gap Identified" value={g.gap_identified} onChange={v=>onSave("gaps",{...g,gap_identified:v})} disabled={!canEdit} wide/>
              <Field label="Use Case" value={g.use_case} onChange={v=>onSave("gaps",{...g,use_case:v})} disabled={!canEdit} type="textarea" wide/>
              <Field label="BD Team Engaged" value={g.bd_team_engaged} onChange={v=>onSave("gaps",{...g,bd_team_engaged:v})} disabled={!canEdit} type="checkbox"/>
              <Field label="Product Team Engaged" value={g.product_team_engaged} onChange={v=>onSave("gaps",{...g,product_team_engaged:v})} disabled={!canEdit} type="checkbox"/>
              <Field label="Customer Blocker" value={g.customer_blocker} onChange={v=>onSave("gaps",{...g,customer_blocker:v})} disabled={!canEdit} type="checkbox"/>
              <Field label="PSOP Ticket" value={g.psop_ticket} onChange={v=>onSave("gaps",{...g,psop_ticket:v})} disabled={!canEdit}/>
            </div>
          </div>))}
      </div>
    </div>
  );
}

function MarketplaceTab({ data, canEdit, onSave }) {
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [catSearch, setCatSearch] = useState("");
  const openCatalog = async () => { setShowCatalog(true); const r = await fetch("/api/ref?table=sf"); const d = await r.json(); setCatalog(d.data || []); };
  const addFromCatalog = async (p) => { await onSave("marketplace", { product_name:p.product_name, partner_account:p.partner_account, solution_type:p.solution_type, partner_category:p.partner_category, partner_subcategory:p.partner_subcategory, stage:p.stage, selected:1 }); setShowCatalog(false); };
  const filteredCatalog = catSearch ? catalog.filter(p => p.product_name?.toLowerCase().includes(catSearch.toLowerCase()) || p.partner_category?.toLowerCase().includes(catSearch.toLowerCase())) : catalog;
  return (
    <div className="space-y-8">
      <CrossTabBanner links={[{field:"App validation (VLOOKUP)",source:"Marketplace SF Lookup!A:A"},{field:"Auto-fill details",source:"FILTER(Marketplace SF Lookup!A:I, ...)"},{field:"Fleet banner",source:"Overview!C1"}]}/>
      <div><div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">Marketplace Apps ({data.marketplace_apps.length})</h3>
        {canEdit && <button onClick={openCatalog} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20"><Plus className="w-3.5 h-3.5"/> Add from SF Catalog</button>}
      </div>
        <div className="bg-[#111827] border border-[#2a3a55] rounded-xl overflow-auto"><table className="w-full text-sm"><thead><tr className="bg-[#1e3a5f]/50">
          <th className="text-left px-4 py-3 text-xs text-[#94a3b8] font-semibold w-12">Valid</th>
          {["Product","Partner","Category","Stage"].map(h=><th key={h} className="text-left px-4 py-3 text-xs text-[#94a3b8] font-semibold">{h}</th>)}
          {canEdit&&<th className="w-10"/>}
        </tr></thead><tbody>
          {data.marketplace_apps.length===0?<tr><td colSpan={6} className="px-4 py-8 text-center text-[#4a5568]">No marketplace apps — click Add from SF Catalog</td></tr>:
          data.marketplace_apps.map(a=>(
            <tr key={a.id} className="border-t border-[#2a3a55]/50 hover:bg-[#1a2234]">
              <td className="px-4 py-2"><span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">{a.product_name?"Yes":"No"}</span></td>
              <td className="px-4 py-2 text-white font-medium">{a.product_name}</td>
              <td className="px-4 py-2 text-[#94a3b8]">{a.partner_account}</td>
              <td className="px-4 py-2 text-[#94a3b8]">{a.partner_category}</td>
              <td className="px-4 py-2"><span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{a.stage}</span></td>
              {canEdit&&<td className="px-2"><button onClick={()=>onSave("marketplace",{id:a.id},"delete")} className="p-1 hover:bg-red-500/10 rounded text-red-400"><Trash2 className="w-3.5 h-3.5"/></button></td>}
            </tr>))}
        </tbody></table></div>
        <p className="text-[10px] text-cyan-400/60 font-mono mt-2">Valid = VLOOKUP(name, Marketplace SF Lookup!$A:$A, 1, FALSE)</p>
      </div>
      {showCatalog && <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={()=>setShowCatalog(false)}>
        <div className="bg-[#111827] border border-[#2a3a55] rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden" onClick={e=>e.stopPropagation()}>
          <div className="p-4 border-b border-[#2a3a55] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Select from SF Catalog ({catalog.length})</h3>
            <button onClick={()=>setShowCatalog(false)} className="text-[#64748b] hover:text-white"><X className="w-5 h-5"/></button>
          </div>
          <div className="p-4 border-b border-[#2a3a55]"><input className="w-full px-3 py-2 bg-[#0a0e17] border border-[#2a3a55] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" placeholder="Search..." value={catSearch} onChange={e=>setCatSearch(e.target.value)}/></div>
          <div className="overflow-y-auto max-h-[60vh]">{filteredCatalog.map(p=>(
            <button key={p.id} onClick={()=>addFromCatalog(p)} className="w-full text-left px-4 py-3 border-b border-[#2a3a55]/30 hover:bg-[#1a2234] transition">
              <div className="flex items-center justify-between">
                <div><span className="text-sm text-white font-medium">{p.product_name}</span><span className="text-xs text-[#64748b] ml-2">{p.partner_account}</span></div>
                <div className="flex gap-2"><span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">{p.partner_category}</span><span className={`text-[10px] px-2 py-0.5 rounded-full ${p.stage==="In Production"?"bg-emerald-500/10 text-emerald-400":"bg-amber-500/10 text-amber-400"}`}>{p.stage}</span></div>
              </div>
            </button>))}</div>
        </div>
      </div>}
      <div><div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">User Provided Apps ({data.upas.length})</h3>
        {canEdit&&<button onClick={()=>onSave("upas",{name:"New App",sort_order:data.upas.length})} className="flex items-center gap-1 text-xs text-blue-400"><Plus className="w-3.5 h-3.5"/> Add UPA</button>}
      </div>
        <div className="space-y-3">
          {data.upas.map(u=>(
            <div key={u.id} className="bg-[#111827] border border-[#2a3a55] rounded-xl p-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name" value={u.name} onChange={v=>onSave("upas",{...u,name:v})} disabled={!canEdit}/>
                <Field label="Website URL" value={u.website_url} onChange={v=>onSave("upas",{...u,website_url:v})} disabled={!canEdit}/>
                <Field label="Use Case" value={u.use_case} onChange={v=>onSave("upas",{...u,use_case:v})} disabled={!canEdit} wide/>
                <Field label="Deeplink" value={u.has_deeplink} onChange={v=>onSave("upas",{...u,has_deeplink:v})} disabled={!canEdit} type="checkbox"/>
                {canEdit&&<div className="flex justify-end col-span-2"><button onClick={()=>onSave("upas",{id:u.id},"delete")} className="text-xs text-red-400 flex items-center gap-1"><Trash2 className="w-3 h-3"/> Remove</button></div>}
              </div>
            </div>))}
          {data.upas.length===0&&<div className="text-center py-8 text-[#4a5568] text-sm">No UPAs</div>}
        </div>
      </div>
    </div>
  );
}


function InstallTab({ data, canEdit, onSave }) {
  const M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const byY={};data.forecasts.forEach(f=>{if(!byY[f.year])byY[f.year]=[];byY[f.year].push(f);});
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4"><p className="text-xs text-blue-300">↑ Fleet: <strong>{data.fleet_name}</strong> (linked from Overview)</p></div>
      {Object.entries(byY).sort(([a],[b])=>+a-+b).map(([yr,fs])=>{
        const s=fs.sort((a,b)=>a.month-b.month);
        return(<div key={yr}><h3 className="text-lg font-bold mb-3">{yr}</h3>
          <div className="bg-[#111827] border border-[#2a3a55] rounded-xl overflow-auto"><table className="w-full text-sm"><thead><tr className="bg-[#1e3a5f]/50">
            <th className="px-3 py-3 text-left text-xs text-[#94a3b8] font-semibold w-24">Type</th>
            {s.map(f=><th key={f.month} className="px-1 py-3 text-center text-xs text-[#94a3b8] font-semibold">{M[f.month-1]}</th>)}
            <th className="px-3 py-3 text-center text-xs text-[#94a3b8] font-semibold bg-blue-500/10">Total</th>
          </tr></thead><tbody>
            <tr className="border-t border-[#2a3a55]/50"><td className="px-3 py-2 text-amber-400 font-medium text-xs">Forecast</td>
              {s.map(f=><td key={f.month} className="px-1 py-2 text-center"><input type="number" className="w-12 bg-transparent text-center text-white text-sm focus:outline-none border-none" value={f.forecasted||0} onChange={e=>onSave("forecasts",{...f,forecasted:parseInt(e.target.value)||0})} disabled={!canEdit}/></td>)}
              <td className="px-3 py-2 text-center font-bold text-amber-400 bg-blue-500/5">{s.reduce((a,f)=>a+(f.forecasted||0),0)}</td>
            </tr>
            <tr className="border-t border-[#2a3a55]/50"><td className="px-3 py-2 text-emerald-400 font-medium text-xs">Actual</td>
              {s.map(f=><td key={f.month} className="px-1 py-2 text-center"><input type="number" className="w-12 bg-transparent text-center text-white text-sm focus:outline-none border-none" value={f.actual||0} onChange={e=>onSave("forecasts",{...f,actual:parseInt(e.target.value)||0})} disabled={!canEdit}/></td>)}
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
    {l:"Marketplace Apps",v:data.stats.marketplace_apps,c:"text-blue-400",src:"COUNTA(Marketplace!A16:A140)"},
    {l:"User Provided Apps",v:data.stats.upas,c:"text-cyan-400",src:"COUNTA(Marketplace!A3:A12)"},
    {l:"Forms",v:data.stats.forms,c:"text-emerald-400",src:"COUNTA(Forms!B2:B200)"},
    {l:"Gaps Identified",v:data.stats.gaps,c:"text-amber-400",src:"COUNTA(Gaps!A2:A200)"},
    {l:"Features Needed",v:data.stats.features_needed,c:"text-violet-400",src:"COUNTIF(Solution Mix)"},
  ];
  const formCats = data.stats.form_categories || {};
  const catLabels = ["All","Fleet Type","Customer/Consignee","Shipper","Terminal","Border Crossing","Other"];
  return (
    <div className="space-y-6">
      {/* Stats!E2 — fleet summary sentence */}
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
        <p className="text-sm text-blue-200">{fleetSummary}</p>
        <p className="text-[10px] text-cyan-400/60 font-mono mt-2">Stats!E2 = CONCATENATE(Overview!B2, Overview!B3, Contacts exec sponsor)</p>
      </div>
      {/* Stats!B2-B4 — aggregate counts */}
      <div className="grid grid-cols-3 lg:grid-cols-5 gap-4">{items.map(s=>(
        <div key={s.l} className="bg-[#1a2234] border border-[#2a3a55] rounded-xl p-6">
          <div className={`text-4xl font-bold mb-2 ${s.c}`}>{s.v}</div>
          <div className="text-sm text-[#64748b]">{s.l}</div>
          <div className="text-[10px] text-[#4a5568] mt-1 font-mono">{s.src}</div>
        </div>))}</div>
      {/* Stats!B6-B12 — form category COUNTIF */}
      <div className="bg-[#111827] border border-[#2a3a55] rounded-xl p-5">
        <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-4">Form Category Breakdown (COUNTIF)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {catLabels.map(cat => (
            <div key={cat} className="flex justify-between py-2 px-3 border border-[#2a3a55]/30 rounded-lg">
              <span className="text-[#94a3b8] text-sm">{cat}</span>
              <span className="text-white font-bold text-sm">{formCats[cat] || 0}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-cyan-400/60 font-mono mt-2">Stats!B6:B12 = COUNTIF(Forms!$G:$G, category)</p>
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
  const invite=async()=>{if(!invEmail)return;const r=await fetch(`/api/scopes/${scopeId}/collaborators`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:invEmail,role:invRole})});if(r.ok){setInvEmail("");window.location.reload();}else{const d=await r.json();alert(d.error);}};
  const remove=async(uid)=>{await fetch(`/api/scopes/${scopeId}/collaborators`,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:uid})});window.location.reload();};
  const copyLink=()=>{if(shareUrl){navigator.clipboard.writeText(shareUrl);setCopied(true);setTimeout(()=>setCopied(false),2000);}};
  const rc={owner:"text-blue-400 bg-blue-500/10 border-blue-500/20",editor:"text-emerald-400 bg-emerald-500/10 border-emerald-500/20",viewer:"text-amber-400 bg-amber-500/10 border-amber-500/20"};
  return (
    <div className="space-y-8">
      <div><h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">Share Link (for Salesforce)</h3>
        <div className="bg-[#111827] border border-[#2a3a55] rounded-xl p-6">
          {data.share_access!=="disabled"&&shareUrl ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 px-4 py-2.5 bg-[#0a0e17] border border-[#2a3a55] rounded-lg font-mono text-sm text-cyan-400 truncate">{shareUrl}</div>
                <button onClick={copyLink} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium flex items-center gap-2">{copied?<Check className="w-4 h-4"/>:<Copy className="w-4 h-4"/>}{copied?"Copied!":"Copy"}</button>
              </div>
              <p className="text-xs text-[#64748b]">Paste this URL into Salesforce. Anyone with the link can view this scope.</p>
              {isOwner&&<button onClick={disableShare} className="text-xs text-red-400">Disable sharing</button>}
            </div>
          ) : (
            <div className="text-center py-4">
              <Link2 className="w-8 h-8 mx-auto mb-3 text-[#2a3a55]"/>
              <p className="text-sm text-[#64748b] mb-4">Sharing disabled. Generate a link to share in Salesforce.</p>
              {isOwner&&<button onClick={enableShare} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium">Generate Share Link</button>}
            </div>
          )}
        </div>
      </div>
      <div><h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">Team Members</h3>
        {isOwner&&<div className="flex gap-3 mb-4">
          <input value={invEmail} onChange={e=>setInvEmail(e.target.value)} placeholder="Email address" className="flex-1 px-4 py-2.5 bg-[#111827] border border-[#2a3a55] rounded-lg text-white text-sm placeholder-[#4a5568] focus:outline-none focus:border-blue-500"/>
          <select value={invRole} onChange={e=>setInvRole(e.target.value)} className="px-3 py-2.5 bg-[#111827] border border-[#2a3a55] rounded-lg text-white text-sm"><option value="viewer">Viewer</option><option value="editor">Editor</option></select>
          <button onClick={invite} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium">Invite</button>
        </div>}
        <div className="space-y-2">{data.collaborators.map(c=>(
          <div key={c.id} className="flex items-center justify-between bg-[#111827] border border-[#2a3a55] rounded-lg px-4 py-3">
            <div><span className="text-white font-medium text-sm">{c.name}</span><span className="text-[#64748b] text-sm ml-2">{c.email}</span></div>
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
  const execSponsor = contacts.find(c => c.contact_type === "fleet" && c.role_title?.toLowerCase().includes("sponsor"));
  const summaryParts = [];
  if (data.fleet_name) {
    summaryParts.push(`${data.fleet_name} is a ${ov.fleet_size_label || ""} ${ov.type_of_operation || ""} ${ov.current_technology || ""} ${ov.fleet_persona || ""} fleet`);
    if (ov.hq_location) summaryParts.push(`located in ${ov.hq_location}`);
    if (execSponsor?.name) summaryParts.push(`Their Executive Sponsor is ${execSponsor.name}${execSponsor.title ? ` (${execSponsor.title})` : ""}`);
    if (ov.account_executive) summaryParts.push(`Account Executive: ${ov.account_executive}`);
  }
  const fleetSentence = summaryParts.length > 0 ? summaryParts.join(". ") + "." : "";
  const tabs = [
    {id:"overview",label:"Overview (AE)",desc:"Fleet profile, TMS, technology, links",fields:"Fleet name, location, size, TSP, TMS, platform",icon:Building2},
    {id:"contacts",label:"Contacts (AE,PMO)",desc:"PS team and fleet contacts",fields:"Pulls AE name from Overview",icon:Phone},
    {id:"marketplace",label:"Marketplace & UPAs",desc:"Apps and user-provided applications",fields:"Validates against Marketplace SF Lookup",icon:ShoppingBag},
    {id:"solution",label:"Solution Mix (AE,SE)",desc:"Features + 3rd party integrations + UPAs",fields:"Pulls TSP, TMS, all tech fields from Overview; UPAs from Marketplace tab",icon:Puzzle},
    {id:"gaps",label:"Gaps (AE,SE)",desc:"Pain points and blockers",fields:"Fleet banner from Overview",icon:AlertTriangle},
    {id:"workshop",label:"Presale Workshop (SE)",desc:"Discovery questions and responses",fields:"Fleet name interpolated into question text from Overview",icon:MessageSquare},
    {id:"workflow",label:"PS WFIntegration (IMP)",desc:"Workflow integration details",fields:"60+ fields linked from Overview + form counts from Stats",icon:Workflow},
    {id:"install",label:"Install Strategy (IMP)",desc:"Monthly install forecasts",fields:"Fleet name from Overview in row labels",icon:Calendar},
    {id:"sf_lookup",label:"Marketplace SF Lookup",desc:"Salesforce product catalog (113 products)",fields:"VLOOKUP source for Marketplace & UPAs app validation",icon:ShoppingBag},
    {id:"km_lookup",label:"KM Marketplace Lookup",desc:"Knowledge Management app catalog (132 apps)",fields:"App descriptions and categories for marketplace selections",icon:ShoppingBag},
    {id:"master_data",label:"MasterData",desc:"Global reference data for dropdowns",fields:"Company types, operation types, TMS providers, workflow integrators",icon:Database},
    {id:"training",label:"Training (TAM)",desc:"Training assessment Q&A",fields:"Fleet name interpolated from Overview",icon:GraduationCap},
    {id:"stats",label:"Stats",desc:"Auto-computed aggregations",fields:"COUNTA from Marketplace, UPAs, Forms tabs",icon:BarChart3},
  ];
  return (
    <div className="space-y-8">
      <FleetSummary data={data}/>
      {/* START HERE!B3 — fleet summary sentence from Overview + Contacts */}
      {fleetSentence && (
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-sm text-blue-200">{fleetSentence}</p>
          <p className="text-[10px] text-cyan-400/60 font-mono mt-2">START HERE!B3 = CONCATENATE(Overview!B2, Overview!B3, Contacts exec sponsor)</p>
        </div>
      )}
      <div>
        <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Platform</h3>
        <p className="text-lg font-bold text-white">{ov.ps_platform || "—"}</p>
        <p className="text-[10px] text-cyan-400/60 font-mono mt-1">START HERE!B5 = Overview!B5</p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">Tab Navigation & Data Flow</h3>
        <div className="space-y-2">
          {tabs.map(t=>{const I=t.icon; return(
            <button key={t.id} onClick={()=>onNavigate(t.id)} className="w-full text-left bg-[#111827] border border-[#2a3a55] rounded-xl p-4 hover:border-blue-500/40 hover:bg-[#1a2234] transition group">
              <div className="flex items-center gap-3">
                <I className="w-5 h-5 text-blue-400 flex-shrink-0"/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{t.label}</span>
                    <span className="text-xs text-[#64748b]">— {t.desc}</span>
                  </div>
                  <p className="text-xs text-cyan-400/60 font-mono mt-1">Linked: {t.fields}</p>
                </div>
                <ArrowLeft className="w-4 h-4 text-[#2a3a55] group-hover:text-blue-400 transition rotate-180"/>
              </div>
            </button>
          );})}
        </div>
      </div>
      {/* RACI Matrix (START HERE rows 6-20) */}
      <div>
        <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">RACI Matrix</h3>
        <div className="bg-[#111827] border border-[#2a3a55] rounded-xl overflow-auto">
          <table className="w-full text-xs">
            <thead><tr className="bg-[#1e3a5f]/50">
              {["Tab","R(esponsible)","A(ccountable)","C(onsulted)","I(nformed)"].map(h=>(
                <th key={h} className="text-left px-3 py-2.5 text-[#94a3b8] font-semibold">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {[
                {tab:"Overview",R:"AE",A:"AE",C:"CUST",I:"SE, SAE, PMO, IMP"},
                {tab:"Contacts",R:"AE, PMO",A:"AE",C:"CUST",I:"SE, CSM, FE, SAE"},
                {tab:"Marketplace",R:"AE, SE, IMP",A:"IMP",C:"CUST, MKT",I:"PMO, SUP, TSA"},
                {tab:"Solution Mix",R:"AE, SE",A:"SE",C:"CUST",I:"SAE, PMO, IMP"},
                {tab:"Gaps",R:"AE, SE",A:"SE",C:"CUST",I:"SAE, PMO, IMP"},
                {tab:"Workshop",R:"SE, INT",A:"SE",C:"CUST",I:"AE, IMP, PMO"},
                {tab:"Forms",R:"SE, IMP",A:"SE",C:"CUST",I:"AE, PMO, INT"},
                {tab:"WF/Integration",R:"IMP, INT",A:"IMP",C:"CUST",I:"PMO, SUP, SAE"},
                {tab:"Install Strategy",R:"IMP, PMO, FE",A:"PMO",C:"CUST",I:"AE, SE, SUP"},
                {tab:"PS+ FORMS",R:"IMP",A:"IMP",C:"CUST",I:"PMO, TSA, INT"},
                {tab:"PSE FORMS",R:"IMP, SAE",A:"IMP",C:"CUST",I:"PMO, TSA"},
                {tab:"SF Lookup",R:"MKT",A:"MKT",C:"MKT",I:"AE, SE, SAE"},
                {tab:"Training",R:"TAM, PMO",A:"TAM",C:"MKT, AE",I:"SAE, IMP, CSM"},
              ].map(r=>(
                <tr key={r.tab} className="border-t border-[#2a3a55]/30 hover:bg-[#1a2234]">
                  <td className="px-3 py-2 text-white font-medium">{r.tab}</td>
                  <td className="px-3 py-2 text-emerald-400">{r.R}</td>
                  <td className="px-3 py-2 text-amber-400">{r.A}</td>
                  <td className="px-3 py-2 text-cyan-400">{r.C}</td>
                  <td className="px-3 py-2 text-[#94a3b8]">{r.I}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">Role Definitions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {[{id:"AE",n:"Account Executive",s:"1-4"},{id:"SE",n:"Solutions Engineer",s:"1-2"},{id:"SAE",n:"Solutions Architect",s:"2"},{id:"PMO",n:"Program Management",s:"2-4"},{id:"INT",n:"Integrations",s:"2-3"},{id:"IMP",n:"Implementer",s:"3"},{id:"CSM",n:"Customer Success",s:"3-4"},{id:"MKT",n:"Marketplace",s:"2-3"},{id:"FE",n:"Field Engineer",s:"3-4"},{id:"AM",n:"Account Manager",s:"4"},{id:"TAM",n:"Training Acct Mgr",s:"3-4"},{id:"TSA",n:"Tech Solution Arch",s:"4"},{id:"SUP",n:"Support",s:"4"},{id:"CUST",n:"Customer",s:"1-4"}].map(r=>(
            <div key={r.id} className="bg-[#111827] border border-[#2a3a55] rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{r.id}</span>
                <span className="text-xs text-white font-medium">{r.n}</span>
              </div>
              <p className="text-[10px] text-[#4a5568] mt-1">Stages: {r.s}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlaceholderTab({ title, desc }) {
  return <div className="text-center py-16"><ClipboardList className="w-12 h-12 mx-auto mb-4 text-[#2a3a55]"/><h3 className="text-lg font-semibold mb-2">{title}</h3><p className="text-sm text-[#64748b] max-w-md mx-auto">{desc}</p></div>;
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

  const canEdit = data?.role==="owner"||data?.role==="editor";

  const load = useCallback(async()=>{
    const r=await fetch(`/api/scopes/${scopeId}`);
    if(!r.ok){setErr("Not found or no access");setLoading(false);return;}
    setData(await r.json());setLoading(false);
  },[scopeId]);

  useEffect(()=>{load();},[load]);

  const save = async(section,d,action)=>{
    setSaving(true);
    const r=await fetch(`/api/scopes/${scopeId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({section,data:d,action})});
    setSaving(false);
    if(r.ok){setSaved(true);setTimeout(()=>setSaved(false),2000);await load();}
    return r.ok;
  };

  if(loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"/></div>;
  if(err||!data) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><p className="text-red-400 mb-4">{err}</p><button onClick={()=>router.push("/dashboard")} className="text-blue-400">← Dashboard</button></div></div>;

  const renderTab = () => {
    switch(tab){
      case "summary": return <SummaryTab data={data} onNavigate={setTab}/>;
      case "overview": return <OverviewTab data={data} canEdit={canEdit} onSave={save}/>;
      case "contacts": return <ContactsTab data={data} canEdit={canEdit} onSave={save}/>;
      case "marketplace": return <MarketplaceTab data={data} canEdit={canEdit} onSave={save}/>;
      case "solution": return <><SolutionTab data={data} canEdit={canEdit} onSave={save}/><SolutionLinkedSection data={data}/></>;
      case "gaps": return <GapsTab data={data} canEdit={canEdit} onSave={save}/>;
      case "install": return <InstallTab data={data} canEdit={canEdit} onSave={save}/>;
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
    <div className="min-h-screen flex">
      <aside className="w-60 flex-shrink-0 border-r border-[#2a3a55] bg-[#111827] sticky top-0 h-screen overflow-y-auto">
        <div className="p-4 border-b border-[#2a3a55]">
          <button onClick={()=>router.push("/dashboard")} className="flex items-center gap-2 text-sm text-[#64748b] hover:text-white transition mb-3"><ArrowLeft className="w-4 h-4"/> Dashboard</button>
          <h2 className="font-bold text-white truncate">{data.fleet_name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${data.status==="active"?"text-emerald-400 bg-emerald-500/10 border-emerald-500/20":"text-amber-400 bg-amber-500/10 border-amber-500/20"}`}>{data.status}</span>
            <span className={`text-[10px] font-bold uppercase ${data.role==="owner"?"text-blue-400":data.role==="editor"?"text-emerald-400":"text-amber-400"}`}>{data.role}</span>
          </div>
        </div>
        <nav className="py-2">{TABS.map(t=>{const I=t.icon;const hasChildren=t.children&&t.children.length;const isExpanded=expandedGroups[t.id]||false;const childActive=hasChildren&&t.children.some(c=>c.id===tab);return(
          <div key={t.id}>
            <button onClick={()=>{if(hasChildren){setExpandedGroups(p=>({...p,[t.id]:!p[t.id]}));if(!isExpanded&&!childActive)setTab(t.id);}else{setTab(t.id);}}} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition border-l-2 ${tab===t.id||childActive?"bg-blue-500/10 text-blue-400 border-l-blue-400 font-semibold":"text-[#64748b] hover:text-white border-l-transparent"}`}><I className="w-4 h-4 flex-shrink-0"/><span className="flex-1 text-left">{t.label}</span>{hasChildren&&<ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded||childActive?"rotate-0":"rotate-[-90deg]"}`}/>}</button>
            {hasChildren&&(isExpanded||childActive)&&t.children.map(c=>(
              <button key={c.id} onClick={()=>setTab(c.id)} className={`w-full flex items-center gap-3 pl-11 pr-4 py-2 text-xs transition border-l-2 ${tab===c.id?"bg-blue-500/10 text-blue-400 border-l-blue-400 font-semibold":"text-[#4a5568] hover:text-white border-l-transparent"}`}>{c.label}</button>
            ))}
          </div>
        );})}</nav>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="sticky top-0 z-40 bg-[#0a0e17]/90 backdrop-blur-sm border-b border-[#2a3a55] px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-lg">{TABS.find(t=>t.id===tab)?.label || TABS.flatMap(t=>t.children||[]).find(c=>c.id===tab)?.label}</h1>
            {saving&&<span className="text-xs text-amber-400 animate-pulse">Saving…</span>}
            {saved&&<span className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3"/> Saved</span>}
          </div>
          <div className="flex items-center gap-3">
            {!canEdit&&<span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">Read Only</span>}
            <a href={`/api/scopes/${scopeId}/export`} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-600/30 transition-colors"><Download className="w-3.5 h-3.5"/> Export Excel</a>
          </div>
        </div>
        <div className="p-8 max-w-5xl">{renderTab()}</div>
      </main>
    </div>
  );
}
