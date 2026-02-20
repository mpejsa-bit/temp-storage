import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTemplates, createTemplate, getScope, getUserRole } from "@/lib/scopes";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await getTemplates();
  return NextResponse.json(templates);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, scope_id } = await req.json();

  if (!name || !scope_id) {
    return NextResponse.json({ error: "name and scope_id are required" }, { status: 400 });
  }

  // Verify the scope exists and user has access
  const scope = await getScope(scope_id);
  if (!scope) return NextResponse.json({ error: "Scope not found" }, { status: 404 });

  const role = await getUserRole(scope_id, session.user.id);
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = await createTemplate(name, description || "", scope_id, session.user.id);
  return NextResponse.json({ id });
}
