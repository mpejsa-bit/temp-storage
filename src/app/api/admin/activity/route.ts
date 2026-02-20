import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isUserAdmin, getRecentActivity } from "@/lib/scopes";

function escapeCSV(value: unknown): string {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function shortUA(ua: string | null): string {
  if (!ua || ua === "unknown") return "";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Safari/") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("MSIE") || ua.includes("Trident")) return "IE";
  return ua.substring(0, 20);
}

function formatLocation(city: string | null, region: string | null): string {
  if (city && region) return `${city}, ${region}`;
  if (city) return city;
  if (region) return region;
  return "";
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await isUserAdmin(session.user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const activity = await getRecentActivity(100);

  const { searchParams } = new URL(req.url);
  if (searchParams.get("format") === "csv") {
    const headers = ["User", "Action", "Detail", "Location", "IP", "Browser", "Timestamp"];
    const rows = activity.map((a: Record<string, unknown>) => [
      escapeCSV(a.user_name),
      escapeCSV(a.action),
      escapeCSV(a.detail),
      escapeCSV(formatLocation(a.city as string | null, a.region as string | null)),
      escapeCSV(a.ip_address),
      escapeCSV(shortUA(a.user_agent as string | null)),
      escapeCSV(a.created_at),
    ].join(","));

    const csv = [headers.join(","), ...rows].join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="activity-log.csv"',
      },
    });
  }

  return NextResponse.json(activity);
}
