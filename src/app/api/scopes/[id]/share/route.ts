import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserRole, enableSharing, disableSharing, logActivity } from "@/lib/scopes";
import { buildActivityMeta } from "@/lib/geo";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getUserRole(params.id, session.user.id);
  if (role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const token = await enableSharing(params.id);
  buildActivityMeta(params.id).then(m => logActivity(session.user.id, "enable_sharing", m)).catch(() => {});
  return NextResponse.json({ token });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getUserRole(params.id, session.user.id);
  if (role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await disableSharing(params.id);
  buildActivityMeta(params.id).then(m => logActivity(session.user.id, "disable_sharing", m)).catch(() => {});
  return NextResponse.json({ ok: true });
}
