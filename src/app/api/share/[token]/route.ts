import { NextResponse } from "next/server";
import {
  getScopeByToken, getOverview, getContacts, getMarketplaceApps,
  getUPAs, getFeatures, getGaps, getForms, getWorkflow, getForecasts,
  getScopeStats, getWorkshopQuestions, getTrainingQuestions
} from "@/lib/scopes";
import { seedDatabase } from "@/lib/seed";

export async function GET(req: Request, { params }: { params: { token: string } }) {
  await seedDatabase();
  const scope = await getScopeByToken(params.token);
  if (!scope) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const id = (scope as Record<string, unknown>).id as string;
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
  const workshop = await getWorkshopQuestions(id);
  const training = await getTrainingQuestions(id);

  return NextResponse.json({
    ...scope,
    role: "viewer",
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
    workshop,
    training,
  });
}
