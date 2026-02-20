#!/usr/bin/env node
/**
 * Migrate data from SQLite (scope.db) to PostgreSQL.
 *
 * Usage:
 *   DATABASE_URL=postgres://scope_user:PASSWORD@localhost:5432/scope_db \
 *   node scripts/migrate-sqlite-to-postgres.js [path/to/scope.db]
 *
 * If no path is given, defaults to ./data/scope.db
 */

const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");
const { Pool } = require("pg");

const DB_PATH = process.argv[2] || path.join(process.cwd(), "data", "scope.db");
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is required.");
  console.error("Example: DATABASE_URL=postgres://scope_user:pass@localhost:5432/scope_db node scripts/migrate-sqlite-to-postgres.js");
  process.exit(1);
}

// Tables in dependency order (parents before children)
const TABLES = [
  "users",
  "scope_documents",
  "scope_collaborators",
  "fleet_overview",
  "contacts",
  "marketplace_apps",
  "user_provided_apps",
  "solution_features",
  "gaps",
  "workshop_questions",
  "training_questions",
  "scope_forms",
  "workflow_integration",
  "install_forecasts",
  "workflow_technical",
  "ref_marketplace_products",
  "ref_master_data",
  "ref_km_marketplace",
  "completion_config",
  "access_log",
  "audit_log",
  "scope_templates",
  "scope_comments",
  "notifications",
];

async function main() {
  // 1. Open SQLite DB
  console.log(`Reading SQLite database from: ${DB_PATH}`);
  if (!fs.existsSync(DB_PATH)) {
    console.error(`ERROR: SQLite database not found at ${DB_PATH}`);
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  const sqliteDb = new SQL.Database(buffer);

  // 2. Connect to Postgres
  console.log(`Connecting to PostgreSQL: ${DATABASE_URL.replace(/:[^:@]+@/, ':***@')}`);
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    await pool.query("SELECT 1");
    console.log("PostgreSQL connection OK.\n");
  } catch (err) {
    console.error("ERROR: Cannot connect to PostgreSQL:", err.message);
    process.exit(1);
  }

  // 3. Get list of tables that actually exist in SQLite
  const sqliteTables = sqliteDb
    .exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    [0]?.values.map((r) => r[0]) || [];

  console.log(`SQLite tables found: ${sqliteTables.join(", ")}\n`);

  let totalRows = 0;
  const results = [];

  for (const table of TABLES) {
    if (!sqliteTables.includes(table)) {
      console.log(`  SKIP  ${table} (not in SQLite DB)`);
      results.push({ table, sqlite: 0, postgres: 0, status: "skipped" });
      continue;
    }

    // Read all rows from SQLite
    const data = sqliteDb.exec(`SELECT * FROM ${table}`);
    if (!data.length || !data[0].values.length) {
      console.log(`  SKIP  ${table} (0 rows)`);
      results.push({ table, sqlite: 0, postgres: 0, status: "empty" });
      continue;
    }

    const columns = data[0].columns;
    const rows = data[0].values;
    const rowCount = rows.length;

    // Build INSERT with $1, $2, ... placeholders
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
    const colList = columns.map((c) => `"${c}"`).join(", ");
    const insertSql = `INSERT INTO ${table} (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

    let inserted = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        const result = await pool.query(insertSql, row);
        if (result.rowCount > 0) inserted++;
      } catch (err) {
        errors++;
        if (errors <= 3) {
          console.error(`    Error inserting into ${table}: ${err.message}`);
        }
      }
    }

    // Verify count in Postgres
    const pgCount = await pool.query(`SELECT COUNT(*) FROM ${table}`);
    const pgRows = parseInt(pgCount.rows[0].count, 10);

    const status = pgRows >= rowCount ? "OK" : `MISMATCH (pg=${pgRows})`;
    console.log(`  ${status.padEnd(8)} ${table}: ${rowCount} rows from SQLite, ${inserted} inserted, ${pgRows} in Postgres${errors ? `, ${errors} errors` : ""}`);

    results.push({ table, sqlite: rowCount, postgres: pgRows, status });
    totalRows += inserted;
  }

  // 4. Summary
  console.log("\n=== Migration Summary ===");
  console.log(`Total rows inserted: ${totalRows}`);

  const mismatches = results.filter((r) => r.status.includes("MISMATCH"));
  if (mismatches.length) {
    console.log("\nWARNING: Row count mismatches:");
    for (const m of mismatches) {
      console.log(`  ${m.table}: SQLite=${m.sqlite}, Postgres=${m.postgres}`);
    }
  } else {
    console.log("All table row counts match. Migration successful!");
  }

  sqliteDb.close();
  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
