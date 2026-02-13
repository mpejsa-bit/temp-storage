import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const table = searchParams.get("table");
  const search = searchParams.get("q") || "";

  const db = await getDb();

  if (table === "masterdata") {
    const rows = db.exec("SELECT category, value FROM ref_master_data ORDER BY category, sort_order");
    const grouped: Record<string, string[]> = {};
    if (rows[0]) {
      for (const r of rows[0].values) {
        const cat = r[0] as string;
        const val = r[1] as string;
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(val);
      }
    }
    return NextResponse.json({ table: "MasterData", data: grouped });
  }

  if (table === "sf") {
    const rows = db.exec(
      search
        ? `SELECT * FROM ref_marketplace_products WHERE product_name LIKE '%' || ? || '%' OR partner_account LIKE '%' || ? || '%' OR partner_category LIKE '%' || ? || '%' ORDER BY product_name`
        : `SELECT * FROM ref_marketplace_products ORDER BY product_name`,
      search ? [search, search, search] : []
    );
    const cols = rows[0]?.columns || [];
    const data = (rows[0]?.values || []).map((r: unknown[]) => {
      const obj: Record<string, unknown> = {};
      cols.forEach((c: string, i: number) => obj[c] = r[i]);
      return obj;
    });
    return NextResponse.json({ table: "Marketplace SF Lookup", count: data.length, data });
  }

  if (table === "km") {
    const rows = db.exec(
      search
        ? `SELECT * FROM ref_km_marketplace WHERE app_name LIKE '%' || ? || '%' OR category LIKE '%' || ? || '%' ORDER BY app_name`
        : `SELECT * FROM ref_km_marketplace ORDER BY app_name`,
      search ? [search, search] : []
    );
    const cols = rows[0]?.columns || [];
    const data = (rows[0]?.values || []).map((r: unknown[]) => {
      const obj: Record<string, unknown> = {};
      cols.forEach((c: string, i: number) => obj[c] = r[i]);
      return obj;
    });
    return NextResponse.json({ table: "KM Marketplace Lookup", count: data.length, data });
  }

  return NextResponse.json({ error: "table param required: sf or km" }, { status: 400 });
}
