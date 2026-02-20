import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createScope, createScopeWithSfData, listScopes, logActivity } from "@/lib/scopes";
import { buildActivityMeta } from "@/lib/geo";
import { seedDatabase } from "@/lib/seed";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await seedDatabase();
  const scopes = await listScopes(session.user.id);
  return NextResponse.json(scopes);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await seedDatabase();
  const { fleet_name, sf_data } = await req.json();
  const name = fleet_name || "New Fleet";
  let id: string;
  if (sf_data) {
    id = await createScopeWithSfData(session.user.id, name, sf_data);
  } else {
    id = await createScope(session.user.id, name);
  }
  buildActivityMeta(name).then(m => logActivity(session.user.id, "create_scope", m)).catch(() => {});
  return NextResponse.json({ id });
}
