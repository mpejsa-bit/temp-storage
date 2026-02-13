"use client";
import { useState, useEffect } from "react";
import { Database, Search } from "lucide-react";

export default function MasterDataTab() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/ref?table=masterdata")
      .then(r => r.json())
      .then(d => { setData(d.data || {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = Object.keys(data);

  // Color map for categories
  const colors = {
    "Yes/No": "blue",
    "Type of Company": "emerald",
    "Type of Operation": "amber",
    "TMS": "violet",
    "TMS Type": "cyan",
    "Workflow Integrator": "rose",
    "Fleet Persona": "blue",
  };

  const getColor = (cat) => {
    const c = colors[cat] || "blue";
    return {
      bg: `bg-${c}-500/10`,
      text: `text-${c}-400`,
      border: `border-${c}-500/15`,
      dot: `bg-${c}-400`,
    };
  };

  if (loading) return <div className="text-center py-12 text-[var(--text-muted)]">Loading reference data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">MasterData Reference</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Global dropdown values used by Overview tab. These feed conditional dropdowns (TMS Type filtered by TMS Provider, Workflow Integrator filtered by TMS).
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"/>
          <input className="pl-9 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:border-blue-500 w-48"
            placeholder="Filter values..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => {
          const values = data[cat] || [];
          const filtered = search ? values.filter(v => v.toLowerCase().includes(search.toLowerCase())) : values;
          if (search && filtered.length === 0) return null;

          return (
            <div key={cat} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)]/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-blue-400"/>
                  <h4 className="text-sm font-semibold text-[var(--text)]">{cat}</h4>
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">{filtered.length} values</span>
              </div>
              <div className="p-3 space-y-1 max-h-[250px] overflow-y-auto">
                {filtered.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--bg-card)] transition text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400/50 flex-shrink-0"/>
                    <span className="text-[var(--text-secondary)]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
        <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">Conditional Dropdown Logic</h4>
        <div className="space-y-2 text-xs text-[var(--text-secondary)]">
          <p><span className="text-cyan-400 font-mono">TMS Type</span> is filtered by the selected TMS Provider. For example, selecting <span className="text-[var(--text)]">TMWSuite</span> shows: Cloud, Hosted, SaaS, On-Prem. Selecting <span className="text-[var(--text)]">TruckMate</span> shows only: On-Prem.</p>
          <p><span className="text-cyan-400 font-mono">Workflow Integrator</span> is also filtered by TMS. <span className="text-[var(--text)]">ICC/Innovative</span> shows: TTC, PS Integration, Direct Data Services. <span className="text-[var(--text)]">TMWSuite</span> adds: Systems Integrator, Totalmail, FleetConneX, Link.</p>
          <p className="text-[10px] text-[var(--text-muted)] mt-2">Source: MasterData columns J (TMS Type Filter) and K (Workflow Integrator Filter)</p>
        </div>
      </div>
    </div>
  );
}
