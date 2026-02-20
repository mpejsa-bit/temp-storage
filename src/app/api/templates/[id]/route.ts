import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTemplate, deleteTemplate, isUserAdmin } from "@/lib/scopes";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const template = await getTemplate(params.id);
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  return NextResponse.json(template);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const template = await getTemplate(params.id);
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  // Only the creator or an admin can delete
  const admin = await isUserAdmin(session.user.id);
  if (template.created_by !== session.user.id && !admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteTemplate(params.id);
  return NextResponse.json({ ok: true });
}
