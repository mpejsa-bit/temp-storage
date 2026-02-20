import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getScope, updateScope, deleteScope, getUserRole, getOverview, updateOverview,
  getContacts, getMarketplaceApps, getUPAs, getFeatures, getGaps, getForms,
  getWorkflow, getForecasts, getScopeStats, getCollaborators, getWorkshopQuestions,
  getTrainingQuestions, cloneScope, upsertRow, deleteRow,
  getWorkflowTechnical, upsertWorkflowTechnical, getCompletionConfig, logActivity
} from "@/lib/scopes";
import { getDb, saveDb } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { computeScopeCompletion } from "@/lib/completion";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const role = await getUserRole(id, session.user.id);
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const scope = await getScope(id);
  const overview = await getOverview(id);
  const contacts = await getContacts(id);
  const marketplaceApps = await getMarketplaceApps(id);
  const upas = await getUPAs(id);
  const features = await getFeatures(id);
  const gaps = await getGaps(id);
  const forms = await getForms(id);
  const workflow = await getWorkflow(id);
  const forecasts = await getForecasts(id);
  const stats = await getScopeStats(id);
  const collaborators = await getCollaborators(id);
  const workshop = await getWorkshopQuestions(id);
  const training = await getTrainingQuestions(id);
  const wfTech = await getWorkflowTechnical(id);

  return NextResponse.json({
    ...scope,
    role,
    overview,
    contacts,
    marketplace_apps: marketplaceApps,
    upas,
    features,
    gaps,
    forms,
    workflow,
    forecasts,
    stats,
    collaborators,
    workshop,
    training,
    workflow_technical: wfTech,
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const role = await getUserRole(id, session.user.id);
  if (!role || role === "viewer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { section, data, action } = body;

  try {
    switch (section) {
      case "scope":
        await updateScope(id, data);
        break;
      case "overview":
        await updateOverview(id, data);
        break;
      case "contacts":
        if (action === "delete") {
          await deleteRow("contacts", data.id);
        } else if (action === "bulk") {
          const items = Array.isArray(data) ? data : [];
          for (const item of items) {
            await upsertRow("contacts", { ...item, scope_id: id });
          }
        } else {
          await upsertRow("contacts", { ...data, scope_id: id });
        }
        break;
      case "upas":
        if (action === "delete") {
          await deleteRow("user_provided_apps", data.id);
        } else {
          await upsertRow("user_provided_apps", { ...data, scope_id: id });
        }
        break;
      case "marketplace":
        if (action === "add") {
          const db = await getDb();
          db.run(
            `INSERT INTO marketplace_apps (id, scope_id, product_name, partner_account, solution_type, partner_category, partner_subcategory, stage, selected)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [generateId(), id, data.product_name, data.partner_account, data.solution_type, data.partner_category, data.partner_subcategory, data.stage]
          );
          saveDb();
        } else if (action === "delete") {
          await deleteRow("marketplace_apps", data.id);
        } else {
          await upsertRow("marketplace_apps", { ...data, scope_id: id });
        }
        break;
      case "features":
        await upsertRow("solution_features", { ...data, scope_id: id });
        break;
      case "gaps":
        if (action === "delete") {
          await deleteRow("gaps", data.id);
        } else {
          await upsertRow("gaps", { ...data, scope_id: id });
        }
        break;
      case "forms":
        if (action === "delete") {
          await deleteRow("scope_forms", data.id);
        } else if (action === "bulk") {
          const items = Array.isArray(data) ? data : data.items;
          if (Array.isArray(items)) {
            for (const item of items) {
              await upsertRow("scope_forms", { ...item, scope_id: id });
            }
          }
        } else {
          await upsertRow("scope_forms", { ...data, scope_id: id });
        }
        break;
      case "training":
        if (action === "delete") {
          await deleteRow("training_questions", data.id);
        } else if (action === "bulk") {
          const questions = Array.isArray(data) ? data : data.questions;
          if (Array.isArray(questions)) {
            for (const q of questions) {
              await upsertRow("training_questions", { ...q, scope_id: id });
            }
          }
        } else {
          await upsertRow("training_questions", { ...data, scope_id: id });
        }
        break;
      case "workflow_technical":
        await upsertWorkflowTechnical(id, data);
        break;
      case "workshop":
        if (action === "delete") {
          await deleteRow("workshop_questions", data.id);
        } else if (action === "bulk") {
          // Bulk insert array of questions
          const questions = Array.isArray(data) ? data : data.questions;
          if (Array.isArray(questions)) {
            for (const q of questions) {
              await upsertRow("workshop_questions", { ...q, scope_id: id });
            }
          }
        } else {
          await upsertRow("workshop_questions", { ...data, scope_id: id });
        }
        break;
      case "forecasts":
        await upsertRow("install_forecasts", { ...data, scope_id: id });
        break;
      case "workflow":
        const db = await getDb();
        db.run("UPDATE workflow_integration SET data_json = ? WHERE scope_id = ?", [
          JSON.stringify(data),
          id,
        ]);
        saveDb();
        break;
      case "clone": {
        const newId = await cloneScope(id, session.user.id);
        logActivity(session.user.id, "clone_scope", id).catch(() => {});
        return NextResponse.json({ id: newId });
      }
      default:
        return NextResponse.json({ error: "Unknown section" }, { status: 400 });
    }

    // Log the update activity
    const actionLabel = action === "delete" ? `delete_${section}` : `update_${section}`;
    logActivity(session.user.id, actionLabel, id).catch(() => {});

    // Always update scope_documents.updated_at so dashboard reflects recent saves
    const touchDb = await getDb();
    touchDb.run("UPDATE scope_documents SET updated_at = ? WHERE id = ?", [new Date().toISOString(), id]);
    saveDb();

    // Auto-update status based on completion %
    try {
      const config = await getCompletionConfig();
      const overview = await getOverview(id);
      const scopeData: Record<string, any> = {
        overview,
        contacts: await getContacts(id),
        marketplace_apps: await getMarketplaceApps(id),
        upas: await getUPAs(id),
        features: await getFeatures(id),
        gaps: await getGaps(id),
        workshop_questions: await getWorkshopQuestions(id),
        training_questions: await getTrainingQuestions(id),
        forms: await getForms(id),
        forecasts: await getForecasts(id),
        workflow_technical: await getWorkflowTechnical(id),
      };
      const completion = computeScopeCompletion(scopeData, config);
      // Only count tabs that have actual requirements configured
      const configuredTabs = Object.entries(completion.tabs).filter(
        ([key]) => config[key] && (config[key].required_fields.length > 0 || (config[key].min_rows ?? 0) > 0)
      );
      const configuredTotal = configuredTabs.reduce((s, [, t]) => s + t.total, 0);
      const configuredFilled = configuredTabs.reduce((s, [, t]) => s + t.filled, 0);
      // Status: complete only when ALL configured requirements are met,
      // draft until at least some configured requirements are filled
      const newStatus = configuredTotal > 0 && configuredFilled >= configuredTotal
        ? "complete"
        : "draft";
      const db2 = await getDb();
      db2.run("UPDATE scope_documents SET status = ? WHERE id = ?", [newStatus, id]);
      saveDb();
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const role = await getUserRole(id, session.user.id);
  if (role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await deleteScope(id);
  logActivity(session.user.id, "delete_scope", id).catch(() => {});
  return NextResponse.json({ ok: true });
}
