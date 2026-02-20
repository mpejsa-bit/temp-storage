import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createScopeFromTemplate, getTemplate, logActivity } from "@/lib/scopes";
import { buildActivityMeta } from "@/lib/geo";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { template_id, fleet_name } = await req.json();

  if (!template_id || !fleet_name) {
    return NextResponse.json(
      { error: "template_id and fleet_name are required" },
      { status: 400 }
    );
  }

  const template = await getTemplate(template_id);
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  try {
    const id = await createScopeFromTemplate(template_id, fleet_name, session.user.id);
    buildActivityMeta(fleet_name)
      .then((m) => logActivity(session.user.id, "create_scope_from_template", m))
      .catch(() => {});
    return NextResponse.json({ id });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create scope from template" }, { status: 500 });
  }
}
