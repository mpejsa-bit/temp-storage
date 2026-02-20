import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserRole } from "@/lib/scopes";
import { getDb, saveDb } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const role = await getUserRole(id, session.user.id);
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db = await getDb();
  const cutoff = new Date(Date.now() - 30000).toISOString(); // 30 seconds ago

  const result = await db.exec(
    `SELECT sp.user_id, u.name
     FROM scope_presence sp
     JOIN users u ON u.id = sp.user_id
     WHERE sp.scope_id = ? AND sp.last_seen > ?`,
    [id, cutoff]
  );

  if (!result.length) return NextResponse.json([]);

  const viewers = result[0].values.map((row) => ({
    user_id: row[0],
    name: row[1],
  }));

  return NextResponse.json(viewers);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const role = await getUserRole(id, session.user.id);
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db = await getDb();
  const now = new Date().toISOString();

  // Upsert presence record
  const existing = await db.exec(
    "SELECT user_id FROM scope_presence WHERE scope_id = ? AND user_id = ?",
    [id, session.user.id]
  );

  if (existing.length && existing[0].values.length) {
    await db.run(
      "UPDATE scope_presence SET last_seen = ? WHERE scope_id = ? AND user_id = ?",
      [now, id, session.user.id]
    );
  } else {
    await db.run(
      "INSERT INTO scope_presence (scope_id, user_id, last_seen) VALUES (?, ?, ?)",
      [id, session.user.id, now]
    );
  }

  saveDb();
  return NextResponse.json({ ok: true });
}
