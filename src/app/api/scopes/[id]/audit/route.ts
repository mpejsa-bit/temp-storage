import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserRole, getAuditLog } from "@/lib/scopes";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const role = await getUserRole(id, session.user.id);
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);

  const entries = await getAuditLog(id, limit);
  return NextResponse.json({ entries });
}
