import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exchangeCodeForToken } from "@/lib/salesforce";

// Exchange OAuth authorization code for access token (server-side to keep client_secret secure)
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code, callbackUrl } = await req.json();
  if (!code || !callbackUrl) {
    return NextResponse.json({ error: "Missing code or callbackUrl" }, { status: 400 });
  }

  try {
    const result = await exchangeCodeForToken(code, callbackUrl);
    return NextResponse.json({
      accessToken: result.accessToken,
      instanceUrl: result.instanceUrl,
    });
  } catch (e: unknown) {
    console.error("Salesforce token exchange error:", e);
    return NextResponse.json(
      { error: (e as Error).message || "Token exchange failed" },
      { status: 502 }
    );
  }
}
