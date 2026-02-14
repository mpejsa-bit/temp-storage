"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Database, Search, Plus, X, Check, Pencil } from "lucide-react";

export default function MasterDataTab() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [pendingEditId, setPendingEditId] = useState(null); // awaiting edit confirmation
  const [pendingEditValue, setPendingEditValue] = useState("");
  const [deletingId, setDeletingId] = useState(null); // awaiting delete confirmation
  const [addingTo, setAddingTo] = useState(null); // category name being added to
  const [newValue, setNewValue] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatValue, setNewCatValue] = useState("");
  const editRef = useRef(null);
  const addRef = useRef(null);
  const newCatRef = useRef(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/ref?table=masterdata")
      .then(r => r.json())
      .then(d => { setData(d.data || {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus();
  }, [editingId]);

  useEffect(() => {
    if (addingTo && addRef.current) addRef.current.focus();
  }, [addingTo]);

  useEffect(() => {
    if (showNewCategory && newCatRef.current) newCatRef.current.focus();
  }, [showNewCategory]);

  // --- CRUD helpers ---
  // Edit: stage the change, then require confirmation
  const handleEditSubmit = (id, newVal) => {
    const trimmed = newVal.trim();
    if (!trimmed) { setEditingId(null); return; }
    setEditingId(null);
    setPendingEditId(id);
    setPendingEditValue(trimmed);
  };

  const confirmEdit = async () => {
    await fetch("/api/ref", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "masterdata", id: pendingEditId, value: pendingEditValue }),
    });
    setPendingEditId(null);
    setPendingEditValue("");
    fetchData();
  };

  const cancelEdit = () => {
    setPendingEditId(null);
    setPendingEditValue("");
  };

  const handleAdd = async (category) => {
    const trimmed = newValue.trim();
    if (!trimmed) { setAddingTo(null); setNewValue(""); return; }
    await fetch("/api/ref", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "masterdata", category, value: trimmed }),
    });
    setAddingTo(null);
    setNewValue("");
    fetchData();
  };

  // Delete: stage the item, then require confirmation
  const handleDelete = (id) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    await fetch("/api/ref", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "masterdata", id: deletingId }),
    });
    setDeletingId(null);
    fetchData();
  };

  const cancelDelete = () => {
    setDeletingId(null);
  };

  const handleNewCategory = async () => {
    const catTrimmed = newCatName.trim();
    const valTrimmed = newCatValue.trim();
    if (!catTrimmed || !valTrimmed) { setShowNewCategory(false); setNewCatName(""); setNewCatValue(""); return; }
    await fetch("/api/ref", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "masterdata", category: catTrimmed, value: valTrimmed }),
    });
    setShowNewCategory(false);
    setNewCatName("");
    setNewCatValue("");
    fetchData();
  };

  const categories = Object.keys(data);

  if (loading) return <div className="text-center py-12 text-[var(--text-muted)]">Loading reference data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">MasterData Reference</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Global dropdown values used by Overview tab. Click a value to edit, use + to add.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewCategory(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Category
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input className="pl-9 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:border-blue-500 w-48"
              placeholder="Filter values..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* New Category Form */}
      {showNewCategory && (
        <div className="bg-[var(--bg-secondary)] border border-blue-500/30 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">New Category</h4>
          <div className="flex gap-3">
            <input
              ref={newCatRef}
              className="flex-1 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:border-blue-500"
              placeholder="Category name..."
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleNewCategory(); if (e.key === "Escape") { setShowNewCategory(false); setNewCatName(""); setNewCatValue(""); } }}
            />
            <input
              className="flex-1 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:border-blue-500"
              placeholder="First value..."
              value={newCatValue}
              onChange={e => setNewCatValue(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleNewCategory(); if (e.key === "Escape") { setShowNewCategory(false); setNewCatName(""); setNewCatValue(""); } }}
            />
            <button onClick={handleNewCategory} className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => { setShowNewCategory(false); setNewCatName(""); setNewCatValue(""); }} className="p-2 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 rounded-lg transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => {
          const items = data[cat] || [];
          const filtered = search ? items.filter(v => v.value.toLowerCase().includes(search.toLowerCase())) : items;
          if (search && filtered.length === 0) return null;

          return (
            <div key={cat} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)]/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <h4 className="text-sm font-semibold text-[var(--text)]">{cat}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--text-muted)]">{filtered.length} values</span>
                  <button
                    onClick={() => { setAddingTo(cat); setNewValue(""); }}
                    className="p-1 text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-500/10 rounded transition"
                    title={`Add value to ${cat}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-3 space-y-1 max-h-[250px] overflow-y-auto">
                {filtered.map(item => (
                  <div key={item.id} className="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--bg-card)] transition text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400/50 flex-shrink-0" />

                    {/* Delete confirmation */}
                    {deletingId === item.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-red-400">Delete &quot;{item.value}&quot;?</span>
                        <button onClick={confirmDelete} className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[10px] font-medium hover:bg-red-500/30 transition">
                          Confirm
                        </button>
                        <button onClick={cancelDelete} className="px-2 py-0.5 bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)] rounded text-[10px] font-medium hover:text-[var(--text)] transition">
                          Cancel
                        </button>
                      </div>

                    /* Edit confirmation */
                    ) : pendingEditId === item.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-[var(--text-muted)] line-through">{item.value}</span>
                        <span className="text-blue-400">{pendingEditValue}</span>
                        <button onClick={confirmEdit} className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[10px] font-medium hover:bg-blue-500/30 transition">
                          Save
                        </button>
                        <button onClick={cancelEdit} className="px-2 py-0.5 bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)] rounded text-[10px] font-medium hover:text-[var(--text)] transition">
                          Cancel
                        </button>
                      </div>

                    /* Inline editing */
                    ) : editingId === item.id ? (
                      <input
                        ref={editRef}
                        className="flex-1 bg-[var(--bg-card)] border border-blue-500/50 rounded px-2 py-0.5 text-[var(--text)] text-xs focus:outline-none"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => handleEditSubmit(item.id, editValue)}
                        onKeyDown={e => { if (e.key === "Enter") handleEditSubmit(item.id, editValue); if (e.key === "Escape") setEditingId(null); }}
                      />

                    /* Normal display */
                    ) : (
                      <>
                        <span
                          className="flex-1 text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text)]"
                          onClick={() => { setEditingId(item.id); setEditValue(item.value); }}
                          title="Click to edit"
                        >
                          {item.value}
                        </span>
                        <button
                          onClick={() => { setEditingId(item.id); setEditValue(item.value); }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--text-muted)] hover:text-blue-400 transition"
                          title="Edit"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--text-muted)] hover:text-red-400 transition"
                          title="Delete"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {/* Inline add input */}
                {addingTo === cat && (
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400/50 flex-shrink-0" />
                    <input
                      ref={addRef}
                      className="flex-1 bg-[var(--bg-card)] border border-green-500/50 rounded px-2 py-0.5 text-[var(--text)] text-xs focus:outline-none"
                      placeholder="New value..."
                      value={newValue}
                      onChange={e => setNewValue(e.target.value)}
                      onBlur={() => handleAdd(cat)}
                      onKeyDown={e => { if (e.key === "Enter") handleAdd(cat); if (e.key === "Escape") { setAddingTo(null); setNewValue(""); } }}
                    />
                  </div>
                )}
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
