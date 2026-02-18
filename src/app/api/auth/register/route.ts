import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { seedDatabase } from "@/lib/seed";
import { rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { ok } = rateLimit(`register:${ip}`, { maxRequests: 5, windowMs: 60_000 });
    if (!ok) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    const { email, password, name } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (trimmedName.length > 100) {
      return NextResponse.json({ error: "Name must be 100 characters or fewer" }, { status: 400 });
    }

    await seedDatabase();
    const db = await getDb();

    const existing = db.exec("SELECT id FROM users WHERE email = ?", [trimmedEmail]);
    if (existing.length && existing[0].values.length) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 12);
    const id = generateId();

    db.run(
      "INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)",
      [id, trimmedEmail, trimmedName, hash]
    );
    saveDb();

    return NextResponse.json({ id, email: trimmedEmail, name: trimmedName });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
