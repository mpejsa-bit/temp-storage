import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isUserAdmin } from "@/lib/scopes";
import { getDb, saveDb } from "@/lib/db";

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

/* helper: convert db.exec result rows into objects */
function execToObjects(result: { columns: string[]; values: unknown[][] }[]): Record<string, unknown>[] {
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

/* Validate a date string is a valid YYYY-MM-DD format */
function isValidDate(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await isUserAdmin(session.user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);

  // Pagination
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") || "100", 10) || 100));
  const offset = (page - 1) * limit;

  // Date filters
  const from = searchParams.get("from"); // YYYY-MM-DD
  const to = searchParams.get("to");     // YYYY-MM-DD

  const db = await getDb();

  // Build WHERE clause
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (from && isValidDate(from)) {
    conditions.push("al.created_at >= ?");
    params.push(from + "T00:00:00");
  }
  if (to && isValidDate(to)) {
    conditions.push("al.created_at <= ?");
    params.push(to + "T23:59:59");
  }

  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  // Get total count for pagination
  const countResult = await db.exec(
    `SELECT COUNT(*) as total FROM access_log al ${where}`,
    params
  );
  const total = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;

  // Get paginated results
  const result = await db.exec(
    `SELECT al.id, al.action, al.detail, al.ip_address, al.city, al.region, al.country, al.user_agent, al.created_at, u.name as user_name
     FROM access_log al
     JOIN users u ON u.id = al.user_id
     ${where}
     ORDER BY al.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const activity = execToObjects(result);

  // CSV export
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

  return NextResponse.json({
    data: activity,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await isUserAdmin(session.user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { from?: string; to?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { from, to } = body;

  if (!from || !to) {
    return NextResponse.json({ error: "Both 'from' and 'to' date fields are required (YYYY-MM-DD)" }, { status: 400 });
  }

  if (!isValidDate(from) || !isValidDate(to)) {
    return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
  }

  if (from > to) {
    return NextResponse.json({ error: "'from' date must be before or equal to 'to' date" }, { status: 400 });
  }

  const db = await getDb();

  // Count rows that will be deleted
  const countResult = await db.exec(
    "SELECT COUNT(*) as cnt FROM access_log WHERE created_at >= ? AND created_at <= ?",
    [from + "T00:00:00", to + "T23:59:59"]
  );
  const count = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;

  // Delete the rows
  await db.run(
    "DELETE FROM access_log WHERE created_at >= ? AND created_at <= ?",
    [from + "T00:00:00", to + "T23:59:59"]
  );
  saveDb();

  return NextResponse.json({ deleted: count, from, to });
}
