"use client";
import { useState, useEffect } from "react";
import { Search, ExternalLink } from "lucide-react";

// Marketplace SF Lookup tab — 113 products from Salesforce catalog
export function SFLookupTab() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/ref?table=sf&q=${encodeURIComponent(search)}`)
        .then(r => r.json())
        .then(d => { setData(d.data || []); setLoading(false); })
        .catch(() => setLoading(false));
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const categories = [...new Set(data.map(d => d.partner_category).filter(Boolean))].sort();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Marketplace SF Lookup</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">Salesforce product catalog — {data.length} products. Used by Marketplace & UPAs tab for VLOOKUP validation.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"/>
          <input
            className="pl-9 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:border-blue-500 w-64"
            placeholder="Search products, partners, categories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map(c => {
          const count = data.filter(d => d.partner_category === c).length;
          return (
            <button key={c} onClick={() => setSearch(c)} className={`text-[10px] px-2 py-1 rounded-full border transition ${search === c ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
              {c} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--text-muted)]">Loading...</div>
      ) : (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-auto max-h-[600px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-blue-500/20/80">
                <th className="text-left px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold">Product Name</th>
                <th className="text-left px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold">Partner Account</th>
                <th className="text-left px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold">Solution Type</th>
                <th className="text-left px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold">Category</th>
                <th className="text-left px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold">Subcategory</th>
                <th className="text-left px-4 py-3 text-xs text-[var(--text-secondary)] font-semibold">Stage</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p, i) => (
                <tr key={p.id || i} className="border-t border-[var(--border)]/30 hover:bg-[var(--bg-card)] group" title={p.product_description || ""}>
                  <td className="px-4 py-2.5 text-[var(--text)] font-medium">{p.product_name}</td>
                  <td className="px-4 py-2.5 text-[var(--text-secondary)]">{p.partner_account}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {(p.solution_type || "").split(";").map((t, j) => (
                        <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/15">{t.trim()}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-cyan-400 text-xs font-medium">{p.partner_category}</td>
                  <td className="px-4 py-2.5 text-[var(--text-muted)] text-xs">{p.partner_subcategory}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      p.stage === 'In Production' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' :
                      p.stage?.includes('Soft Launch') ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' :
                      'bg-violet-500/10 text-violet-400 border border-violet-500/15'
                    }`}>{p.stage}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expanded row detail on hover would go here — for now descriptions show as title tooltip */}
      <p className="text-[10px] text-[var(--text-muted)]">Hover over a product name to see its description. This table validates marketplace app selections via VLOOKUP.</p>
    </div>
  );
}

// KM Marketplace Lookup tab — 132 apps from knowledge management
export function KMLookupTab() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/ref?table=km&q=${encodeURIComponent(search)}`)
        .then(r => r.json())
        .then(d => { setData(d.data || []); setLoading(false); })
        .catch(() => setLoading(false));
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const categories = [...new Set(data.map(d => d.category).filter(Boolean))].sort();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">KM Marketplace Lookup</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">Knowledge Management app catalog — {data.length} apps. Provides descriptions and categories for marketplace app selections.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"/>
          <input
            className="pl-9 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:border-blue-500 w-64"
            placeholder="Search apps or categories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {categories.map(c => {
          const count = data.filter(d => d.category === c).length;
          return (
            <button key={c} onClick={() => setSearch(c)} className={`text-[10px] px-2 py-1 rounded-full border transition ${search === c ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
              {c} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--text-muted)]">Loading...</div>
      ) : (
        <div className="space-y-2">
          {data.map((a, i) => (
            <div key={a.id || i}
              className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4 hover:border-blue-500/30 transition cursor-pointer"
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[var(--text)] font-medium text-sm">{a.app_name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/15">{a.category}</span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">{expanded === i ? "▼" : "▶"}</span>
              </div>
              {expanded === i && a.description && (
                <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border)]/30 pt-3">{a.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
