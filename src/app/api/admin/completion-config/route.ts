import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCompletionConfig, upsertCompletionConfig, isUserAdmin } from "@/lib/scopes";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await getCompletionConfig();
  return NextResponse.json(config);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await isUserAdmin(session.user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { tab_key, config } = await req.json();
  if (!tab_key || !config) {
    return NextResponse.json({ error: "tab_key and config are required" }, { status: 400 });
  }

  await upsertCompletionConfig(tab_key, config);
  return NextResponse.json({ success: true });
}
