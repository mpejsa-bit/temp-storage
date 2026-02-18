"use client";
import { useState } from "react";
import { CrossTabBanner } from "./CrossTabBanner";
import { Plus, Trash2, ClipboardList, ChevronDown, ChevronRight } from "lucide-react";
import { useDebouncedCallback } from "@/hooks/useDebounce";

const FORM_CATEGORIES = ["All", "Pre-Trip", "Post-Trip", "Dispatch", "Safety", "Compliance", "Custom"];
const FIELD_TYPES = ["Text", "Number", "Multiple Choice", "Yes/No", "Date", "Time", "Signature", "Photo", "Barcode", "GPS", "Dropdown", "Multi-Select", "Section Header", "Paragraph"];

const DEFAULT_FORMS = [
  { form_name: "Arrived Shipper", form_category: "All", form_number: 1 },
  { form_name: "Empty Consignee", form_category: "All", form_number: 2 },
  { form_name: "Request Route", form_category: "Dispatch", form_number: 3 },
];

export default function FormsTab({ data, canEdit, onSave }) {
  const [expanded, setExpanded] = useState(null);
  const forms = data.forms || [];

  const addForm = async () => {
    await onSave("forms", {
      form_number: forms.length + 1,
      form_name: "",
      purpose: "",
      used_in_workflow: 0,
      driver_or_dispatch: "",
      driver_response_expected: 0,
      form_category: "All",
      decision_tree_logic: 0,
      stored_procedures: 0,
      stored_procedure_desc: "",
      form_type: "ps_plus",
      form_fields: "[]",
      sort_order: forms.length,
    });
  };

  const populateDefaults = async () => {
    const items = DEFAULT_FORMS.map((f, i) => ({
      ...f, purpose: "", used_in_workflow: 0, driver_or_dispatch: "",
      driver_response_expected: 0, decision_tree_logic: 0,
      stored_procedures: 0, stored_procedure_desc: "",
      form_type: "ps_plus", form_fields: "[]", sort_order: i,
    }));
    await onSave("forms", { items }, "bulk");
  };

  const debouncedSave = useDebouncedCallback(onSave, 800);
  const updateForm = async (form, field, value) => {
    await onSave("forms", { ...form, [field]: value });
  };
  const debouncedUpdateForm = async (form, field, value) => {
    await debouncedSave("forms", { ...form, [field]: value });
  };

  const deleteForm = async (form) => {
    await onSave("forms", { id: form.id }, "delete");
  };

  const toggleExpand = (id) => {
    setExpanded(expanded === id ? null : id);
  };

  // Form field builder sub-component
  const FormFieldBuilder = ({ form }) => {
    let fields = [];
    try { fields = JSON.parse(form.form_fields || "[]"); } catch(e) { fields = []; }

    const addField = async () => {
      const newFields = [...fields, { num: fields.length + 1, name: "", description: "", field_type: "Text", options: "", driver_option: "", dispatch_option: "", source: "", driver_override: "", example: "", comments: "" }];
      await updateForm(form, "form_fields", JSON.stringify(newFields));
    };

    const updateField = async (idx, key, val) => {
      const updated = [...fields];
      updated[idx] = { ...updated[idx], [key]: val };
      if (key === "field_type") {
        await updateForm(form, "form_fields", JSON.stringify(updated));
      } else {
        await debouncedUpdateForm(form, "form_fields", JSON.stringify(updated));
      }
    };

    const removeField = async (idx) => {
      const updated = fields.filter((_, i) => i !== idx);
      await updateForm(form, "form_fields", JSON.stringify(updated));
    };

    return (
      <div className="mt-4 border-t border-[var(--border)]/30 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            Form Fields ({fields.length})
            <span className="text-[var(--text-muted)] font-normal ml-2">
              {form.form_type === "pse" ? "PSE FORMS Table" : "PS+ FORMS Table"} structure
            </span>
          </h4>
          {canEdit && (
            <button onClick={addField} className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
              <Plus className="w-3 h-3"/> Add Field
            </button>
          )}
        </div>

        {fields.length === 0 ? (
          <p className="text-[10px] text-[var(--text-muted)] italic">No fields defined. Click Add Field to start building.</p>
        ) : (
          <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg overflow-auto max-h-[400px]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-blue-500/20/80">
                <tr>
                  <th className="px-2 py-2 text-left text-[var(--text-secondary)] font-semibold w-8">#</th>
                  <th className="px-2 py-2 text-left text-[var(--text-secondary)] font-semibold">Field Name</th>
                  <th className="px-2 py-2 text-left text-[var(--text-secondary)] font-semibold">Description</th>
                  <th className="px-2 py-2 text-left text-[var(--text-secondary)] font-semibold w-28">Field Type</th>
                  <th className="px-2 py-2 text-left text-[var(--text-secondary)] font-semibold">Options</th>
                  <th className="px-2 py-2 text-left text-[var(--text-secondary)] font-semibold w-20">Source</th>
                  <th className="px-2 py-2 text-left text-[var(--text-secondary)] font-semibold">Example</th>
                  {canEdit && <th className="px-2 py-2 w-8"></th>}
                </tr>
              </thead>
              <tbody>
                {fields.map((f, i) => (
                  <tr key={i} className="border-t border-[var(--border)]/20 hover:bg-[var(--bg-secondary)]">
                    <td className="px-2 py-1.5 text-[var(--text-muted)]">{i + 1}</td>
                    <td className="px-2 py-1.5">
                      <input className="w-full bg-transparent text-[var(--text)] text-xs focus:outline-none" value={f.name || ""} onChange={e => updateField(i, "name", e.target.value)} disabled={!canEdit} placeholder="Field name"/>
                    </td>
                    <td className="px-2 py-1.5">
                      <input className="w-full bg-transparent text-[var(--text-secondary)] text-xs focus:outline-none" value={f.description || ""} onChange={e => updateField(i, "description", e.target.value)} disabled={!canEdit} placeholder="Description"/>
                    </td>
                    <td className="px-2 py-1.5">
                      <select className="bg-[var(--bg-secondary)] text-[var(--text)] text-xs border border-[var(--border)] rounded px-1 py-0.5 focus:outline-none focus:border-blue-500" value={f.field_type || "Text"} onChange={e => updateField(i, "field_type", e.target.value)} disabled={!canEdit}>
                        {FIELD_TYPES.map(ft => <option key={ft} value={ft}>{ft}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input className="w-full bg-transparent text-[var(--text-secondary)] text-xs focus:outline-none" value={f.options || ""} onChange={e => updateField(i, "options", e.target.value)} disabled={!canEdit} placeholder="MC options..."/>
                    </td>
                    <td className="px-2 py-1.5">
                      <input className="w-full bg-transparent text-[var(--text-secondary)] text-xs focus:outline-none" value={f.source || ""} onChange={e => updateField(i, "source", e.target.value)} disabled={!canEdit} placeholder="Source"/>
                    </td>
                    <td className="px-2 py-1.5">
                      <input className="w-full bg-transparent text-[var(--text-secondary)] text-xs focus:outline-none" value={f.example || ""} onChange={e => updateField(i, "example", e.target.value)} disabled={!canEdit} placeholder="Example"/>
                    </td>
                    {canEdit && (
                      <td className="px-2 py-1.5">
                        <button onClick={() => removeField(i)} className="text-red-400/40 hover:text-red-400"><Trash2 className="w-3 h-3"/></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <CrossTabBanner links={[
        {field: "Form structure", source: "PS+ FORMS Table / PSE FORMS Table"},
        {field: "Form counts", source: "Stats!B3 via COUNTA"},
      ]}/>

      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">
          Master form definitions with field-level builders. Each form links to a detailed field table (PS+ or PSE format).
        </p>
        <div className="flex gap-2">
          {canEdit && forms.length === 0 && (
            <button onClick={populateDefaults}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
              <ClipboardList className="w-3.5 h-3.5"/> Populate Defaults
            </button>
          )}
          {canEdit && (
            <button onClick={addForm}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
              <Plus className="w-3.5 h-3.5"/> Add Form
            </button>
          )}
        </div>
      </div>

      {forms.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl">
          <ClipboardList className="w-12 h-12 text-[#2a3a55] mx-auto mb-4"/>
          <p className="text-[var(--text-muted)] text-sm">No forms defined yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {forms.map((form, i) => (
            <div key={form.id} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg overflow-hidden hover:border-[#3a4a65] transition">
              {/* Form header row */}
              <div className="p-4 cursor-pointer" onClick={() => toggleExpand(form.id)}>
                <div className="flex items-center gap-3">
                  {expanded === form.id ? <ChevronDown className="w-4 h-4 text-blue-400 flex-shrink-0"/> : <ChevronRight className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0"/>}
                  <span className="text-[var(--text-muted)] text-xs font-mono w-8">{form.form_number || i + 1}</span>
                  {canEdit ? (
                    <input className="flex-1 bg-transparent text-[var(--text)] text-sm font-medium focus:outline-none" value={form.form_name || ""} onClick={e => e.stopPropagation()} onChange={e => debouncedUpdateForm(form, "form_name", e.target.value)} placeholder="Form name..."/>
                  ) : (
                    <span className="text-[var(--text)] text-sm font-medium">{form.form_name || "Untitled"}</span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${form.form_type === 'pse' ? 'bg-violet-500/10 text-violet-400 border-violet-500/15' : 'bg-blue-500/10 text-blue-400 border-blue-500/15'}`}>
                    {form.form_type === "pse" ? "PSE" : "PS+"}
                  </span>
                  {form.form_category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/15">{form.form_category}</span>
                  )}
                  {canEdit && (
                    <button onClick={e => { e.stopPropagation(); deleteForm(form); }} className="text-red-400/40 hover:text-red-400">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === form.id && (
                <div className="px-4 pb-4 border-t border-[var(--border)]/30">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Purpose / Current Use</label>
                      <textarea className="w-full mt-1 px-2 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded text-[var(--text)] text-xs focus:outline-none focus:border-blue-500 resize-y disabled:opacity-50"
                        rows={2} value={form.purpose || ""} onChange={e => debouncedUpdateForm(form, "purpose", e.target.value)} disabled={!canEdit}/>
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Used in Workflow?</label>
                      <select className="w-full mt-1 px-2 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded text-[var(--text)] text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        value={form.used_in_workflow || 0} onChange={e => updateForm(form, "used_in_workflow", parseInt(e.target.value))} disabled={!canEdit}>
                        <option value={0}>No</option><option value={1}>Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Driver or Dispatch Initiated</label>
                      <select className="w-full mt-1 px-2 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded text-[var(--text)] text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        value={form.driver_or_dispatch || ""} onChange={e => updateForm(form, "driver_or_dispatch", e.target.value)} disabled={!canEdit}>
                        <option value="">—</option><option value="Driver">Driver</option><option value="Dispatch">Dispatch</option><option value="Both">Both</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Driver Response Expected?</label>
                      <select className="w-full mt-1 px-2 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded text-[var(--text)] text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        value={form.driver_response_expected || 0} onChange={e => updateForm(form, "driver_response_expected", parseInt(e.target.value))} disabled={!canEdit}>
                        <option value={0}>No</option><option value={1}>Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Form Category</label>
                      <select className="w-full mt-1 px-2 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded text-[var(--text)] text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        value={form.form_category || ""} onChange={e => updateForm(form, "form_category", e.target.value)} disabled={!canEdit}>
                        <option value="">—</option>
                        {FORM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Form Platform</label>
                      <select className="w-full mt-1 px-2 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded text-[var(--text)] text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        value={form.form_type || "ps_plus"} onChange={e => updateForm(form, "form_type", e.target.value)} disabled={!canEdit}>
                        <option value="ps_plus">PS+ FORMS</option><option value="pse">PSE FORMS</option><option value="general">General</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Decision Tree Logic?</label>
                      <select className="w-full mt-1 px-2 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded text-[var(--text)] text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        value={form.decision_tree_logic || 0} onChange={e => updateForm(form, "decision_tree_logic", parseInt(e.target.value))} disabled={!canEdit}>
                        <option value={0}>No</option><option value={1}>Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Stored Procedures?</label>
                      <select className="w-full mt-1 px-2 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded text-[var(--text)] text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        value={form.stored_procedures || 0} onChange={e => updateForm(form, "stored_procedures", parseInt(e.target.value))} disabled={!canEdit}>
                        <option value={0}>No</option><option value={1}>Yes</option>
                      </select>
                    </div>
                  </div>
                  {form.stored_procedures === 1 && (
                    <div className="mt-3">
                      <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Describe Stored Procedures</label>
                      <textarea className="w-full mt-1 px-2 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded text-[var(--text)] text-xs focus:outline-none focus:border-blue-500 resize-y disabled:opacity-50"
                        rows={2} value={form.stored_procedure_desc || ""} onChange={e => debouncedUpdateForm(form, "stored_procedure_desc", e.target.value)} disabled={!canEdit}/>
                    </div>
                  )}

                  {/* Form Field Builder — PS+ FORMS Table / PSE FORMS Table */}
                  <FormFieldBuilder form={form}/>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-[10px] text-[var(--text-muted)] border-t border-[var(--border)]/30 pt-3">
        {forms.length} forms defined.
        PS+ forms: {forms.filter(f => f.form_type !== "pse").length} |
        PSE forms: {forms.filter(f => f.form_type === "pse").length} |
        Total fields: {forms.reduce((acc, f) => { try { return acc + JSON.parse(f.form_fields || "[]").length; } catch { return acc; } }, 0)}
      </div>
    </div>
  );
}
