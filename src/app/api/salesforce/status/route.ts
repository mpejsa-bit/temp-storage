import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSfOAuthUrl } from "@/lib/salesforce";

// Returns the OAuth authorize URL for the client to open in a popup
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const callbackUrl = searchParams.get("callback") || `${new URL(req.url).origin}/salesforce-callback`;

  const configured = !!(process.env.SF_CLIENT_ID);
  const authUrl = configured ? getSfOAuthUrl(callbackUrl) : null;

  return NextResponse.json({ configured, authUrl });
}
