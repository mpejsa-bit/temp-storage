import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { seedDatabase } from "@/lib/seed";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    await seedDatabase();
    const db = await getDb();

    const existing = db.exec("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length && existing[0].values.length) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 12);
    const id = generateId();

    db.run(
      "INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)",
      [id, email, name, hash]
    );
    saveDb();

    return NextResponse.json({ id, email, name });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
