import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isUserAdmin, updateUser, deleteUser } from "@/lib/scopes";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await isUserAdmin(session.user.id);
  if (!admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = params;
  const body = await request.json();

  const data: { is_admin?: number; name?: string } = {};
  if (body.is_admin !== undefined) {
    data.is_admin = body.is_admin ? 1 : 0;
  }
  if (body.name !== undefined) {
    data.name = body.name;
  }

  try {
    await updateUser(id, data);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await isUserAdmin(session.user.id);
  if (!admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = params;

  // Don't allow deleting yourself
  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 }
    );
  }

  try {
    await deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
