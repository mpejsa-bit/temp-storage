import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createScope, listScopes } from "@/lib/scopes";
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
  const { fleet_name } = await req.json();
  const id = await createScope(session.user.id, fleet_name || "New Fleet");
  return NextResponse.json({ id });
}
