import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  listScopes, getScope, getOverview, getContacts, getFeatures,
  getMarketplaceApps, getUPAs, getGaps, getForms, getWorkflow,
  getForecasts, getScopeStats, getCollaborators, getWorkshopQuestions,
  getTrainingQuestions, getWorkflowTechnical,
} from "@/lib/scopes";

function escapeCSV(value: unknown): string {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scopeList = await listScopes(session.user.id);

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format");

  if (format === "csv") {
    // CSV summary export
    const headers = [
      "Fleet Name", "Status", "Owner", "Contacts", "Features",
      "Created", "Updated",
    ];

    const rows: string[] = [];
    for (const s of scopeList) {
      const contacts = await getContacts(s.id);
      const features = await getFeatures(s.id);
      const contactsCount = Array.isArray(contacts) ? contacts.length : 0;
      const featuresCount = Array.isArray(features) ? features.filter((f: Record<string, unknown>) => f.needed === 1).length : 0;

      rows.push([
        escapeCSV(s.fleet_name),
        escapeCSV(s.status),
        escapeCSV(s.owner_name),
        escapeCSV(contactsCount),
        escapeCSV(featuresCount),
        escapeCSV(s.created_at),
        escapeCSV(s.updated_at),
      ].join(","));
    }

    const csv = [headers.join(","), ...rows].join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="scopes-export.csv"',
      },
    });
  }

  // Full JSON export
  const fullScopes = [];
  for (const s of scopeList) {
    const scope = await getScope(s.id);
    const overview = await getOverview(s.id);
    const contacts = await getContacts(s.id);
    const marketplaceApps = await getMarketplaceApps(s.id);
    const upas = await getUPAs(s.id);
    const features = await getFeatures(s.id);
    const gaps = await getGaps(s.id);
    const forms = await getForms(s.id);
    const workflow = await getWorkflow(s.id);
    const forecasts = await getForecasts(s.id);
    const stats = await getScopeStats(s.id);
    const collaborators = await getCollaborators(s.id);
    const workshop = await getWorkshopQuestions(s.id);
    const training = await getTrainingQuestions(s.id);
    const wfTech = await getWorkflowTechnical(s.id);

    fullScopes.push({
      ...scope,
      role: s.role,
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

  return NextResponse.json(fullScopes);
}
