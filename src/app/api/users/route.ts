import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

// Returns a simple list of users (id, name) for @mention autocomplete.
// Available to any authenticated user.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const result = await db.exec("SELECT id, name FROM users ORDER BY LOWER(name)");
  if (!result.length) return NextResponse.json([]);

  const users = result[0].values.map((row) => ({
    id: row[0],
    name: row[1],
  }));
  return NextResponse.json(users);
}
