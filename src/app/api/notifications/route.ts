import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/scopes";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";

  const notifications = await getNotifications(session.user.id, unreadOnly);
  return NextResponse.json(notifications);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.all === true) {
    await markAllNotificationsRead(session.user.id);
  } else if (body.id) {
    await markNotificationRead(body.id);
  } else {
    return NextResponse.json({ error: "Provide id or all:true" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
