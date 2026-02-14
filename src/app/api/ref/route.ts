import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { generateId } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const table = searchParams.get("table");
  const search = searchParams.get("q") || "";

  const db = await getDb();

  if (table === "masterdata") {
    const rows = db.exec("SELECT id, category, value, sort_order FROM ref_master_data ORDER BY category, sort_order");
    const grouped: Record<string, { id: string; value: string; sort_order: number }[]> = {};
    if (rows[0]) {
      for (const r of rows[0].values) {
        const id = r[0] as string;
        const cat = r[1] as string;
        const val = r[2] as string;
        const sort = r[3] as number;
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({ id, value: val, sort_order: sort });
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

export async function POST(req: Request) {
  const body = await req.json();
  const { table, category, value } = body;

  if (table !== "masterdata" || !category || !value) {
    return NextResponse.json({ error: "Required: table='masterdata', category, value" }, { status: 400 });
  }

  const db = await getDb();
  const id = generateId();

  // Get max sort_order for this category
  const maxRows = db.exec("SELECT MAX(sort_order) FROM ref_master_data WHERE category = ?", [category]);
  const maxSort = (maxRows[0]?.values[0]?.[0] as number | null) ?? -1;

  db.run("INSERT INTO ref_master_data (id, category, value, sort_order) VALUES (?, ?, ?, ?)", [
    id, category, value, maxSort + 1,
  ]);
  saveDb();

  return NextResponse.json({ id, category, value, sort_order: maxSort + 1 });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { table, id, value } = body;

  if (table !== "masterdata" || !id || !value) {
    return NextResponse.json({ error: "Required: table='masterdata', id, value" }, { status: 400 });
  }

  const db = await getDb();
  db.run("UPDATE ref_master_data SET value = ? WHERE id = ?", [value, id]);
  saveDb();

  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { table, category, orderedIds } = body;

  if (table !== "masterdata" || !category || !Array.isArray(orderedIds)) {
    return NextResponse.json({ error: "Required: table='masterdata', category, orderedIds[]" }, { status: 400 });
  }

  const db = await getDb();
  for (let i = 0; i < orderedIds.length; i++) {
    db.run("UPDATE ref_master_data SET sort_order = ? WHERE id = ? AND category = ?", [i, orderedIds[i], category]);
  }
  saveDb();

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const { table, id } = body;

  if (table !== "masterdata" || !id) {
    return NextResponse.json({ error: "Required: table='masterdata', id" }, { status: 400 });
  }

  const db = await getDb();
  db.run("DELETE FROM ref_master_data WHERE id = ?", [id]);
  saveDb();

  return NextResponse.json({ ok: true });
}
