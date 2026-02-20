import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isUserAdmin, getAllUsers } from "@/lib/scopes";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await isUserAdmin(session.user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await getAllUsers();
  return NextResponse.json(users);
}
