"use client";
import { CrossTabBanner } from "./CrossTabBanner";
import { Plus, Trash2, GraduationCap } from "lucide-react";

const DEFAULT_TRAINING_QS = [
  {cat:"Driver Training", q:"What is the size and bandwidth of your {fleet} Training Team?"},
  {cat:"Driver Training", q:"How does driver onboarding work today at {fleet}?"},
  {cat:"Driver Training", q:"What devices and materials do drivers currently receive during orientation?"},
  {cat:"Driver Training", q:"What LMS platform does {fleet} currently use?"},
  {cat:"Driver Training", q:"How are ongoing training updates communicated to drivers in the field?"},
  {cat:"Admin/Dispatch Training", q:"How many dispatchers/fleet managers need to be trained?"},
  {cat:"Admin/Dispatch Training", q:"What does the current dispatcher onboarding process look like?"},
  {cat:"Admin/Dispatch Training", q:"Are there any power users or champions who could help drive adoption?"},
  {cat:"Safety Training", q:"How does {fleet} handle safety incident review and retraining?"},
  {cat:"Safety Training", q:"What is the current cadence of safety meetings?"},
  {cat:"Implementation", q:"What is {fleet} preferred go-live cadence (big bang vs phased)?"},
  {cat:"Implementation", q:"Are there any seasonal or operational constraints on training timing?"},
];

export default function TrainingTab({ data, canEdit, onSave }) {
  const fleet = data.fleet_name || "Fleet";
  const questions = data.training || [];

  const populateDefaults = async () => {
    const bulk = DEFAULT_TRAINING_QS.map((dq, i) => ({
      sub_category: dq.cat,
      question: dq.q.replace(/{fleet}/g, fleet),
      response: "",
      comments: "",
      sort_order: i,
    }));
    await onSave("training", { questions: bulk }, "bulk");
  };

  const updateQuestion = async (q, field, value) => {
    await onSave("training", { ...q, [field]: value });
  };

  const deleteQuestion = async (q) => {
    await onSave("training", { id: q.id }, "delete");
  };

  const addQuestion = async () => {
    await onSave("training", {
      sub_category: "General",
      question: "",
      response: "",
      comments: "",
      sort_order: questions.length,
    });
  };

  const grouped = {};
  questions.forEach(q => {
    const cat = q.sub_category || "General";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(q);
  });

  return (
    <div className="space-y-6">
      <CrossTabBanner links={[
        {field: "Fleet Name in questions", source: "Overview!B2"},
        {field: "Fleet summary banner", source: "=CONCATENATE(Overview!B2, ...)"},
      ]}/>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#64748b]">
            Training assessment questions for TAM. Fleet name{" "}
            <span className="text-cyan-400 font-mono text-xs">({fleet})</span>{" "}
            is auto-inserted.
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && questions.length === 0 && (
            <button onClick={populateDefaults}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20 transition">
              <GraduationCap className="w-3.5 h-3.5"/>
              Populate Default Questions ({DEFAULT_TRAINING_QS.length})
            </button>
          )}
          {canEdit && (
            <button onClick={addQuestion}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
              <Plus className="w-3.5 h-3.5"/> Add Question
            </button>
          )}
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-16 bg-[#111827] border border-[#2a3a55] rounded-xl">
          <GraduationCap className="w-12 h-12 text-[#2a3a55] mx-auto mb-4"/>
          <p className="text-[#4a5568] text-sm mb-2">No training questions yet.</p>
          <p className="text-[#4a5568] text-xs">Click the green button above to populate the standard 12-question set.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, catQs]) => (
            <div key={cat}>
              <h3 className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400"/>
                {cat}
                <span className="text-[#4a5568] font-normal lowercase">({catQs.length})</span>
              </h3>
              <div className="space-y-2">
                {catQs.map(q => (
                  <div key={q.id} className="bg-[#111827] border border-[#2a3a55] rounded-lg p-4 hover:border-[#3a4a65] transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-3">
                        {canEdit ? (
                          <input className="w-full bg-transparent text-white text-sm font-medium focus:outline-none border-b border-transparent focus:border-blue-500/50 pb-1"
                            value={q.question || ""} onChange={e => updateQuestion(q, "question", e.target.value)} placeholder="Enter question..."/>
                        ) : (
                          <p className="text-sm text-white font-medium">{q.question}</p>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-[#64748b] uppercase tracking-wider">Response</label>
                            <textarea className="w-full mt-1 px-3 py-2 bg-[#0a0e17] border border-[#2a3a55] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-y disabled:opacity-50"
                              rows={2} value={q.response || ""} onChange={e => updateQuestion(q, "response", e.target.value)} disabled={!canEdit} placeholder="Response..."/>
                          </div>
                          <div>
                            <label className="text-[10px] text-[#64748b] uppercase tracking-wider">Comments</label>
                            <textarea className="w-full mt-1 px-3 py-2 bg-[#0a0e17] border border-[#2a3a55] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-y disabled:opacity-50"
                              rows={2} value={q.comments || ""} onChange={e => updateQuestion(q, "comments", e.target.value)} disabled={!canEdit} placeholder="Comments..."/>
                          </div>
                        </div>
                      </div>
                      {canEdit && (
                        <button onClick={() => deleteQuestion(q)} className="text-red-400/40 hover:text-red-400 mt-1 flex-shrink-0">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="text-[10px] text-[#4a5568] border-t border-[#2a3a55]/30 pt-3">
        {questions.length} questions across {Object.keys(grouped).length} categories
      </div>
    </div>
  );
}
