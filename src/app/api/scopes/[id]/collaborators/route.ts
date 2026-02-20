import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getUserRole, addCollaborator, removeCollaborator, getCollaborators,
  updateCollaboratorRole, searchUsers, logActivity,
  createNotificationIfEnabled, getScope,
} from "@/lib/scopes";
import { buildActivityMeta } from "@/lib/geo";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  // User search endpoint for collaborator autocomplete
  if (search !== null) {
    const users = await searchUsers(search);
    return NextResponse.json(users);
  }

  const role = await getUserRole(params.id, session.user.id);
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const collaborators = await getCollaborators(params.id);
  return NextResponse.json(collaborators);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getUserRole(params.id, session.user.id);
  if (role !== "owner") return NextResponse.json({ error: "Only owner can manage collaborators" }, { status: 403 });

  const body = await req.json();

  // Handle role update
  if (body.action === "update_role" && body.user_id && body.role) {
    try {
      await updateCollaboratorRole(params.id, body.user_id, body.role);
      return NextResponse.json({ ok: true });
    } catch (e: unknown) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  // Handle add collaborator (supports email or name)
  const identifier = body.email || body.name;
  if (!identifier) return NextResponse.json({ error: "email or name required" }, { status: 400 });

  try {
    await addCollaborator(params.id, identifier, body.role || "viewer");
    buildActivityMeta(`${identifier} to ${params.id}`).then(m => logActivity(session.user.id, "add_collaborator", m)).catch(() => {});

    // Notify the added user
    try {
      const scope = await getScope(params.id) as any;
      const collaborators = await getCollaborators(params.id);
      const addedUser = collaborators.find((c: any) =>
        c.email?.toLowerCase() === identifier.toLowerCase() ||
        c.name?.toLowerCase() === identifier.toLowerCase()
      );
      if (addedUser && addedUser.user_id !== session.user.id) {
        const inviterName = session.user.name || "Someone";
        await createNotificationIfEnabled(
          addedUser.user_id as string,
          params.id,
          "collaborator_added",
          `${inviterName} added you as ${body.role || "viewer"} on ${scope?.fleet_name || "a scope"}`
        );
      }
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getUserRole(params.id, session.user.id);
  if (role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { user_id } = await req.json();
  await removeCollaborator(params.id, user_id);
  buildActivityMeta(`${user_id} from ${params.id}`).then(m => logActivity(session.user.id, "remove_collaborator", m)).catch(() => {});
  return NextResponse.json({ ok: true });
}
