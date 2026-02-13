import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAccountWithContacts, parseSfToken } from "@/lib/salesforce";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = parseSfToken(req);
  if (!token) {
    return NextResponse.json({ error: "Salesforce access token required" }, { status: 400 });
  }

  try {
    const data = await getAccountWithContacts(token.accessToken, token.instanceUrl, params.id);
    return NextResponse.json(data);
  } catch (e: unknown) {
    console.error("Salesforce account fetch error:", e);
    return NextResponse.json(
      { error: (e as Error).message || "Failed to fetch account" },
      { status: 502 }
    );
  }
}
