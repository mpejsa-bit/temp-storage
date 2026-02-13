import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchAccounts, parseSfToken } from "@/lib/salesforce";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = parseSfToken(req);
  if (!token) {
    return NextResponse.json({ error: "Salesforce access token required" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
  }

  try {
    const accounts = await searchAccounts(token.accessToken, token.instanceUrl, q);
    return NextResponse.json(accounts);
  } catch (e: unknown) {
    console.error("Salesforce search error:", e);
    return NextResponse.json(
      { error: (e as Error).message || "Salesforce query failed" },
      { status: 502 }
    );
  }
}
