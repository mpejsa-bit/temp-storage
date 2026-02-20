import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserRole } from "@/lib/scopes";
import { getDb } from "@/lib/db";

function rowToObj(columns: string[], values: unknown[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  columns.forEach((col, i) => (obj[col] = values[i]));
  return obj;
}

function execToObjects(result: { columns: string[]; values: unknown[][] }[]): Record<string, unknown>[] {
  if (!result.length) return [];
  return result[0].values.map((row) => rowToObj(result[0].columns, row));
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const role = await getUserRole(id, session.user.id);
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(req.url);
  const field = url.searchParams.get("field");
  if (!field) return NextResponse.json({ error: "field parameter required" }, { status: 400 });

  const db = await getDb();

  // Get audit_log entries for this scope's overview section, limited to 50 most recent
  const result = await db.exec(
    `SELECT a.before_json, a.after_json, a.created_at, a.action, u.name as user_name
     FROM audit_log a
     JOIN users u ON u.id = a.user_id
     WHERE a.scope_id = ? AND a.section = 'overview'
     ORDER BY a.created_at DESC
     LIMIT 50`,
    [id]
  );

  const rows = execToObjects(result);

  // Parse each row and extract changes for the specific field
  const changes: { user_name: string; old_value: string; new_value: string; created_at: string }[] = [];

  for (const row of rows) {
    try {
      const before = JSON.parse((row.before_json as string) || "{}");
      const after = JSON.parse((row.after_json as string) || "{}");

      const oldVal = before[field];
      const newVal = after[field];

      // Only include if field actually changed
      if (oldVal !== newVal && (oldVal !== undefined || newVal !== undefined)) {
        changes.push({
          user_name: row.user_name as string,
          old_value: oldVal == null ? "" : String(oldVal),
          new_value: newVal == null ? "" : String(newVal),
          created_at: row.created_at as string,
        });
      }
    } catch {
      // Skip malformed entries
    }
  }

  // Return only the last 10 changes for this field
  return NextResponse.json({ changes: changes.slice(0, 10) });
}
