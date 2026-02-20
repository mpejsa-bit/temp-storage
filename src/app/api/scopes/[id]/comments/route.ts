import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getComments, addComment, deleteComment, getComment,
  getUserRole, isUserAdmin, getScope, createNotification,
} from "@/lib/scopes";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const role = await getUserRole(id, session.user.id);
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section") || undefined;

  const comments = await getComments(id, section);
  return NextResponse.json(comments);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const role = await getUserRole(id, session.user.id);
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { section, text } = await req.json();
  if (!section || !text?.trim()) {
    return NextResponse.json({ error: "section and text are required" }, { status: 400 });
  }

  const commentId = await addComment(id, session.user.id, section, text.trim());

  // Notify the scope owner if commenter is not the owner
  try {
    const scope = await getScope(id) as any;
    if (scope && scope.owner_id !== session.user.id) {
      const userName = session.user.name || "Someone";
      await createNotification(
        scope.owner_id,
        id,
        "comment",
        `${userName} commented on ${section} in ${scope.fleet_name}`
      );
    }
  } catch {}

  return NextResponse.json({ id: commentId });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: commentId } = await req.json();
  if (!commentId) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const comment = await getComment(commentId);
  if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

  // Only the author or an admin can delete
  const admin = await isUserAdmin(session.user.id);
  if (comment.user_id !== session.user.id && !admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteComment(commentId);
  return NextResponse.json({ ok: true });
}
