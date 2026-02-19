import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  listScopes,
  getCompletionConfig,
  getOverview,
  getContacts,
  getMarketplaceApps,
  getUPAs,
  getFeatures,
  getGaps,
  getWorkshopQuestions,
  getTrainingQuestions,
  getForms,
  getForecasts,
  getWorkflowTechnical,
} from "@/lib/scopes";
import { computeScopeCompletion } from "@/lib/completion";

async function getScopeFullData(scopeId: string) {
  const [overview, contacts, marketplace_apps, upas, features, gaps, workshop_questions, training_questions, forms, forecasts, workflow_technical] = await Promise.all([
    getOverview(scopeId),
    getContacts(scopeId),
    getMarketplaceApps(scopeId),
    getUPAs(scopeId),
    getFeatures(scopeId),
    getGaps(scopeId),
    getWorkshopQuestions(scopeId),
    getTrainingQuestions(scopeId),
    getForms(scopeId),
    getForecasts(scopeId),
    getWorkflowTechnical(scopeId),
  ]);
  return { overview, contacts, marketplace_apps, upas, features, gaps, workshop_questions, training_questions, forms, forecasts, workflow_technical };
}

// GET /api/scopes/completion — returns completion % for all user's scopes
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scopes = await listScopes(session.user.id);
  const config = await getCompletionConfig();

  const results: Record<string, { overall: number; tabs: Record<string, { percent: number }> }> = {};

  for (const scope of scopes) {
    const scopeData = await getScopeFullData(scope.id);
    const completion = computeScopeCompletion(scopeData, config);
    results[scope.id] = completion;
  }

  return NextResponse.json(results);
}
