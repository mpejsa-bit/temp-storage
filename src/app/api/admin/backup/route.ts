import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isUserAdmin } from "@/lib/scopes";
import { createBackup, listBackups, deleteBackup } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const admin = await isUserAdmin(session.user.id);
  if (!admin) return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const backups = await listBackups();
    return NextResponse.json({ backups });
  } catch (e: unknown) {
    console.error("List backups error:", e);
    return NextResponse.json({ error: "Failed to list backups" }, { status: 500 });
  }
}

export async function POST() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const filename = await createBackup();
    return NextResponse.json({ ok: true, filename });
  } catch (e: unknown) {
    console.error("Create backup error:", e);
    return NextResponse.json({ error: "Failed to create backup" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { filename } = body;
    if (!filename || typeof filename !== "string") {
      return NextResponse.json({ error: "Filename required" }, { status: 400 });
    }
    await deleteBackup(filename);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("Delete backup error:", e);
    return NextResponse.json({ error: "Failed to delete backup" }, { status: 500 });
  }
}
