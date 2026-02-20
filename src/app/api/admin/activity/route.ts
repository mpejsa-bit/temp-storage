import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isUserAdmin, getRecentActivity } from "@/lib/scopes";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await isUserAdmin(session.user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const activity = await getRecentActivity(100);
  return NextResponse.json(activity);
}
