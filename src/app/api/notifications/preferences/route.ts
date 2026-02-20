import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getNotificationPrefs, updateNotificationPrefs } from "@/lib/scopes";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefs = await getNotificationPrefs(session.user.id);
  return NextResponse.json(prefs);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  await updateNotificationPrefs(session.user.id, body);
  const updated = await getNotificationPrefs(session.user.id);
  return NextResponse.json(updated);
}
