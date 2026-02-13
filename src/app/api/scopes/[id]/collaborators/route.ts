import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserRole, addCollaborator, removeCollaborator, getCollaborators } from "@/lib/scopes";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getUserRole(params.id, session.user.id);
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const collaborators = await getCollaborators(params.id);
  return NextResponse.json(collaborators);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getUserRole(params.id, session.user.id);
  if (role !== "owner") return NextResponse.json({ error: "Only owner can invite" }, { status: 403 });

  const { email, role: newRole } = await req.json();
  try {
    await addCollaborator(params.id, email, newRole || "viewer");
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getUserRole(params.id, session.user.id);
  if (role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { user_id } = await req.json();
  await removeCollaborator(params.id, user_id);
  return NextResponse.json({ ok: true });
}
