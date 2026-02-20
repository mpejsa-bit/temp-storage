import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isUserAdmin, transferOwnership } from "@/lib/scopes";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await isUserAdmin(session.user.id);
  if (!admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { scope_id, new_owner_id } = body;

  if (!scope_id || !new_owner_id) {
    return NextResponse.json(
      { error: "scope_id and new_owner_id are required" },
      { status: 400 }
    );
  }

  try {
    await transferOwnership(scope_id, new_owner_id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Transfer failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
