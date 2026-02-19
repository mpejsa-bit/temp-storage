"use client";
import { Plus, Trash2, MessageSquare, RotateCcw } from "lucide-react";
import { useDebouncedCallback } from "@/hooks/useDebounce";

const DEFAULT_QUESTIONS = [
  {cat:"Technology & Integrations",q:"Of the legacy systems {fleet} is using today, what is the level of satisfaction with each?"},
  {cat:"Technology & Integrations",q:"What are some current pain points with how the telematics technology suite works today?"},
  {cat:"Technology & Integrations",q:"What are you looking to improve in transitioning to a new telematics solution?"},
  {cat:"Technology & Integrations",q:"What software and or applications would you like to integrate with the new telematics solution?"},
  {cat:"Technology & Integrations",q:"Which systems must be integrated?"},
  {cat:"Technology & Integrations",q:"Which systems would be nice to integrate?"},
  {cat:"Technology & Integrations",q:"Challenges with current system integrations?"},
  {cat:"Technology & Integrations",q:"How is system of record data synced across the various {fleet} data systems?"},
  {cat:"Technology & Integrations",q:"Is {fleet} using SSO today, which platform is being used?"},
  {cat:"Technology & Integrations",q:"Are there any future capabilities that we haven't captured that exist on {fleet}'s future roadmap?"},
  {cat:"Safety & Compliance",q:"How is your Safety/Compliance department structured?"},
  {cat:"Safety & Compliance",q:"What does a day in the life of a Safety/Compliance manager look like at {fleet}?"},
  {cat:"Safety & Compliance",q:"What are your current ELD challenges in-cab? What about the back office?"},
  {cat:"Safety & Compliance",q:"What daily reports does your team use? If alerting is used, how have you set those alerts up?"},
  {cat:"Safety & Compliance",q:"How are driver groups structured?"},
  {cat:"Safety & Compliance",q:"Any operating regions inside of Canada?"},
  {cat:"Safety & Compliance",q:"How is log editing handled today?"},
  {cat:"Safety & Compliance",q:"Any unique state/province rulesets?"},
  {cat:"Safety & Compliance",q:"Are short haul, 16-hour, and/or adverse condition exemptions used?"},
  {cat:"Safety & Compliance",q:"Are yardmoves or personal conveyance used?"},
  {cat:"Safety & Compliance",q:"How is unassigned drive time handled today?"},
  {cat:"Driver Experience & Workflow",q:"Walk us through your current day routine for jobs dispatch and tracking?"},
  {cat:"Driver Experience & Workflow",q:"How are load assignments handled today?"},
  {cat:"Driver Experience & Workflow",q:"Can drivers have pre-assigned or queued loads?"},
  {cat:"Driver Experience & Workflow",q:"What are {fleet}'s expectations related to fully automated workflow?"},
  {cat:"Driver Experience & Workflow",q:"What current applications are used in completing day to day job tasks?"},
  {cat:"Driver Experience & Workflow",q:"What applications reside on the in-cab telematics provider device?"},
  {cat:"Driver Experience & Workflow",q:"What applications reside on a driver supplied device (phone)?"},
  {cat:"Driver Experience & Workflow",q:"Are there any other devices used in-cab for Job data capture?"},
  {cat:"Driver Experience & Workflow",q:"Common areas of data validation challenges?"},
  {cat:"Driver Experience & Workflow",q:"What are some of the in cab driver challenges with your present telematics provider?"},
  {cat:"Driver Experience & Workflow",q:"How is driver training and support handled today?"},
  {cat:"Equipment & Maintenance",q:"How do you use telematics today for fleet maintenance?"},
  {cat:"Equipment & Maintenance",q:"Are your currently using any OEM diagnostics services? For instance, Cummins Connect, Eaton Intelliconnect, or Navistar OnCommand?"},
  {cat:"Equipment & Maintenance",q:"How are tractor and trailer DVIRs handled today?"},
  {cat:"Equipment & Maintenance",q:"How are telematics devices installed?"},
  {cat:"Equipment & Maintenance",q:"What are your processes for supporting and maintaining telematics devices?"},
  {cat:"Equipment & Maintenance",q:"What are your typical installation timelines? Would {fleet} need 3rd party installation support?"},
  {cat:"Equipment & Maintenance",q:"How are driver tablets installed?"},
  {cat:"Equipment & Maintenance",q:"Where would you want the installations to occur?"},
  {cat:"Equipment & Maintenance",q:"How is hardware replacement and/or repair currently handled?"},
  {cat:"Equipment & Maintenance",q:"Does {fleet} maintain their own ELD hardware backstock?"},
  {cat:"Back Office Integrations",q:"Who would be your key stakeholders throughout a telematics change?"},
  {cat:"Back Office Integrations",q:"Do you have an identified project manager?"},
  {cat:"Back Office Integrations",q:"Are you planning on handling integrations in-house? Alternatively, do you have a preferred integration partner you use today?"},
  {cat:"Back Office Integrations",q:"What's the size and bandwidth of your {fleet} Training Team?"},
  {cat:"Back Office Integrations",q:"What would be your preferred training strategy? For instance, train-the-trainer, remote training, hands-on workshops or a combination of all three?"},
  {cat:"Back Office Integrations",q:"How does your team support ongoing training and management of feature releases to drivers and back office staff?"},
];

export default function WorkshopTab({ data, canEdit, onSave }) {
  const fleet = data.fleet_name || "Fleet";
  const questions = data.workshop || [];

  const populateDefaults = async () => {
    const bulkQuestions = DEFAULT_QUESTIONS.map((dq, i) => ({
      sub_category: dq.cat,
      question: dq.q.replace(/{fleet}/g, fleet),
      response: "",
      sort_order: i,
    }));
    await onSave("workshop", { questions: bulkQuestions }, "bulk");
  };

  const debouncedSave = useDebouncedCallback(onSave, 800);
  const updateQuestion = async (q, field, value) => {
    await debouncedSave("workshop", { ...q, [field]: value });
  };

  const deleteQuestion = async (q) => {
    await onSave("workshop", { id: q.id }, "delete");
  };

  const addQuestion = async () => {
    await onSave("workshop", {
      sub_category: "General",
      question: "",
      response: "",
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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)]">
            Presale workshop questions with responses. Fleet name{" "}
            <span className="text-blue-400 font-medium text-xs">({fleet})</span>{" "}
            is auto-inserted into question text.
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && questions.length === 0 && (
            <button
              onClick={populateDefaults}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20 transition"
            >
              <MessageSquare className="w-3.5 h-3.5"/>
              Populate Default Questions ({DEFAULT_QUESTIONS.length})
            </button>
          )}
          {canEdit && questions.length > 0 && (
            <button
              onClick={populateDefaults}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20 transition"
            >
              <RotateCcw className="w-3.5 h-3.5"/>
              Reset Defaults
            </button>
          )}
          {canEdit && (
            <button
              onClick={addQuestion}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20 transition"
            >
              <Plus className="w-3.5 h-3.5"/> Add Question
            </button>
          )}
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl">
          <MessageSquare className="w-12 h-12 text-[#2a3a55] mx-auto mb-4"/>
          <p className="text-[var(--text-muted)] text-sm mb-2">No workshop questions yet.</p>
          <p className="text-[var(--text-muted)] text-xs">Click the green button above to populate with the standard {DEFAULT_QUESTIONS.length}-question set.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, catQuestions]) => (
            <div key={cat}>
              <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"/>
                {cat}
                <span className="text-[var(--text-muted)] font-normal lowercase">({catQuestions.length} questions)</span>
              </h3>
              <div className="space-y-2">
                {catQuestions.map(q => (
                  <div key={q.id} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4 hover:border-[#3a4a65] transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {canEdit ? (
                          <input
                            className="w-full bg-transparent text-[var(--text)] text-sm font-medium focus:outline-none border-b border-transparent focus:border-blue-500/50 pb-1 transition"
                            value={q.question || ""}
                            onChange={e => updateQuestion(q, "question", e.target.value)}
                            placeholder="Enter question..."
                          />
                        ) : (
                          <p className="text-sm text-[var(--text)] font-medium">{q.question}</p>
                        )}

                        <div className="mt-3">
                          <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Response</label>
                          <textarea
                            className="w-full mt-1 px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:border-blue-500 transition disabled:opacity-50 resize-y"
                            rows={2}
                            value={q.response || ""}
                            onChange={e => updateQuestion(q, "response", e.target.value)}
                            disabled={!canEdit}
                            placeholder="Customer response..."
                          />
                        </div>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => deleteQuestion(q)}
                          className="text-red-400/40 hover:text-red-400 mt-1 transition flex-shrink-0"
                        >
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

      <div className="text-[10px] text-[var(--text-muted)] border-t border-[var(--border)]/30 pt-3">
        {questions.length} questions total across {Object.keys(grouped).length} categories
      </div>
    </div>
  );
}
