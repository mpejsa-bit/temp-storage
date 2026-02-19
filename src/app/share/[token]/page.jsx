"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Building2, Phone, Puzzle, BarChart3, Layers, Check } from "lucide-react";
export default function SharePage() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`/api/share/${params.token}`)
      .then(r => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError("This scope is not available."); setLoading(false); });
  }, [params.token]);
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (error || !data) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-400">{error}</p></div>;
  const ov = data.overview || {};
  return (
    <div className="min-h-screen">
      <header className="border-b border-[#2a3a55] bg-[#111827]/80 px-6 py-4"><div className="max-w-5xl mx-auto flex items-center gap-3"><Layers className="w-5 h-5 text-blue-400"/><span className="font-bold">Solution Scoping Document</span><span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">Shared View</span></div></header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">{data.fleet_name}</h1>
        <p className="text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 text-sm mb-8">{data.fleet_name} is a {ov.fleet_size_label||"—"} {ov.type_of_operation||"—"} {ov.current_technology||"—"} {ov.fleet_persona||"—"} fleet</p>
        <section className="mb-10"><h2 className="flex items-center gap-2 text-lg font-bold mb-4 pb-2 border-b border-[#2a3a55]"><Building2 className="w-5 h-5 text-blue-400"/> Overview</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">{[["HQ",ov.hq_location],["Platform",ov.ps_platform],["Timezone",ov.fleet_timezone],["Technology",ov.current_technology],["Persona",ov.fleet_persona],["Company",ov.type_of_company],["Operation",ov.type_of_operation],["Drivers",ov.num_drivers],["Tractors",ov.num_tractors],["Trailers",ov.num_trailers],["TSP",ov.current_tsp],["TMS",ov.current_tms],["TMS Type",ov.current_tms_type],["AE",ov.account_executive]].map(([l,v])=><div key={l} className="flex justify-between py-1 border-b border-[#2a3a55]/30"><span className="text-[#64748b]">{l}</span><span className="text-white font-medium">{v||"—"}</span></div>)}</div>
        </section>
        <section className="mb-10"><h2 className="flex items-center gap-2 text-lg font-bold mb-4 pb-2 border-b border-[#2a3a55]"><Puzzle className="w-5 h-5 text-blue-400"/> Solution Mix</h2>
          <div className="bg-[#111827] border border-[#2a3a55] rounded-xl overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-[#1e3a5f]/50"><th className="text-left px-4 py-3 text-xs text-[#94a3b8] font-semibold">Feature</th><th className="text-center px-4 py-3 text-xs text-[#94a3b8] font-semibold w-20">Needed</th><th className="text-center px-4 py-3 text-xs text-[#94a3b8] font-semibold w-20">Licenses</th></tr></thead><tbody>{data.features?.map(f=><tr key={f.id} className="border-t border-[#2a3a55]/50"><td className="px-4 py-2 text-white">{f.feature_name}</td><td className="px-4 py-2 text-center">{f.needed?<Check className="w-4 h-4 text-emerald-400 mx-auto"/>:<span className="text-[#2a3a55]">—</span>}</td><td className="px-4 py-2 text-center text-[#94a3b8]">{f.num_licenses||"—"}</td></tr>)}</tbody></table></div>
        </section>
        <section className="mb-10"><h2 className="flex items-center gap-2 text-lg font-bold mb-4 pb-2 border-b border-[#2a3a55]"><BarChart3 className="w-5 h-5 text-blue-400"/> Stats</h2>
          <div className="grid grid-cols-3 gap-4">{[["Marketplace Apps",data.stats?.marketplace_apps,"text-blue-400"],["UPAs",data.stats?.upas,"text-cyan-400"],["Features",data.stats?.features_needed,"text-violet-400"],["Gaps",data.stats?.gaps,"text-amber-400"],["Forms",data.stats?.forms,"text-emerald-400"]].map(([l,v,c])=><div key={l} className="bg-[#1a2234] border border-[#2a3a55] rounded-xl p-5"><div className={`text-3xl font-bold mb-1 ${c}`}>{v||0}</div><div className="text-xs text-[#64748b]">{l}</div></div>)}</div>
        </section>
      </main>
    </div>
  );
}
