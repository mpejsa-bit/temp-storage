import initSqlJs, { Database } from "sql.js";
import fs from "fs/promises";
import path from "path";

// ── Adapter interface ─────────────────────────────────────────────────
// Both SQLite and Postgres adapters expose the same async API.
// exec() returns sql.js-style {columns, values}[] arrays.
// run() is fire-and-forget (INSERT/UPDATE/DELETE).

export interface DbResult {
  columns: string[];
  values: unknown[][];
}

export interface DbAdapter {
  exec(sql: string, params?: unknown[]): Promise<DbResult[]>;
  run(sql: string, params?: unknown[]): Promise<void>;
}

const DATABASE_MODE = process.env.DATABASE_MODE || "sqlite";

// ── SQLite adapter ────────────────────────────────────────────────────

const DB_PATH = process.env.ELECTRON_DATA_DIR
  ? path.join(process.env.ELECTRON_DATA_DIR, "scope.db")
  : path.join(process.cwd(), "data", "scope.db");

const BACKUP_DIR = process.env.ELECTRON_DATA_DIR
  ? path.join(process.env.ELECTRON_DATA_DIR, "backups")
  : path.join(process.cwd(), "data", "backups");

const MAX_BACKUPS = 24;
const BACKUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

let sqliteDb: Database | null = null;
let saving = false;
let saveQueued = false;
let lastBackupTime = 0;

class SqliteAdapter implements DbAdapter {
  constructor(private db: Database) {}

  async exec(sql: string, params?: unknown[]): Promise<DbResult[]> {
    return this.db.exec(sql, params);
  }

  async run(sql: string, params?: unknown[]): Promise<void> {
    this.db.run(sql, params);
  }
}

// ── Postgres adapter ──────────────────────────────────────────────────

let pgPool: any = null; // pg.Pool — typed as any to avoid import when not used

function convertPlaceholders(sql: string): string {
  // Convert ? placeholders to $1, $2, ... (skipping ? inside quotes)
  let idx = 0;
  let result = "";
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      result += ch;
    } else if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      result += ch;
    } else if (ch === "?" && !inSingle && !inDouble) {
      idx++;
      result += `$${idx}`;
    } else {
      result += ch;
    }
  }
  return result;
}

function convertDatetimeNow(sql: string): string {
  // Convert SQLite datetime('now') to Postgres CURRENT_TIMESTAMP
  return sql.replace(/datetime\(\s*'now'\s*\)/gi, "CURRENT_TIMESTAMP");
}

class PgAdapter implements DbAdapter {
  constructor(private pool: any) {}

  async exec(sql: string, params?: unknown[]): Promise<DbResult[]> {
    const pgSql = convertDatetimeNow(convertPlaceholders(sql));
    const result = await this.pool.query(pgSql, params || []);
    if (!result.fields || !result.fields.length) return [];
    const columns = result.fields.map((f: any) => f.name);
    const values = result.rows.map((row: any) =>
      columns.map((col: string) => row[col])
    );
    return [{ columns, values }];
  }

  async run(sql: string, params?: unknown[]): Promise<void> {
    const pgSql = convertDatetimeNow(convertPlaceholders(sql));
    await this.pool.query(pgSql, params || []);
  }
}

// ── Shared getDb / saveDb ─────────────────────────────────────────────

let adapter: DbAdapter | null = null;

export async function getDb(): Promise<DbAdapter> {
  if (adapter) return adapter;

  if (DATABASE_MODE === "postgres") {
    const { Pool } = await import("pg");
    pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
    adapter = new PgAdapter(pgPool);
    await initPostgresSchema(adapter);
    return adapter;
  }

  // SQLite mode (default)
  const SQL = await initSqlJs();

  try {
    const buffer = await fs.readFile(DB_PATH);
    sqliteDb = new SQL.Database(buffer);
    runMigrations(sqliteDb);
  } catch {
    sqliteDb = new SQL.Database();
    initSqliteSchema(sqliteDb);
  }

  adapter = new SqliteAdapter(sqliteDb);
  return adapter;
}

export function saveDb() {
  if (DATABASE_MODE === "postgres") return; // Postgres auto-persists

  if (!sqliteDb) return;
  if (saving) {
    saveQueued = true;
    return;
  }
  saving = true;
  const data = sqliteDb.export();
  const dir = path.dirname(DB_PATH);
  fs.mkdir(dir, { recursive: true })
    .then(() => fs.writeFile(DB_PATH, Buffer.from(data)))
    .then(() => {
      const now = Date.now();
      if (now - lastBackupTime > BACKUP_INTERVAL_MS) {
        lastBackupTime = now;
        createBackup().catch((err) => console.error("Auto-backup failed:", err));
      }
    })
    .catch((err) => console.error("Failed to save DB:", err))
    .finally(() => {
      saving = false;
      if (saveQueued) {
        saveQueued = false;
        saveDb();
      }
    });
}

// ── Backup functions (SQLite only) ────────────────────────────────────

export async function createBackup(): Promise<string> {
  if (DATABASE_MODE === "postgres") {
    throw new Error("Use pg_dump for Postgres backups");
  }

  await fs.mkdir(BACKUP_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `scope-${timestamp}.db`;
  const backupPath = path.join(BACKUP_DIR, filename);

  try {
    const data = await fs.readFile(DB_PATH);
    await fs.writeFile(backupPath, data);
  } catch {
    if (sqliteDb) {
      const data = sqliteDb.export();
      await fs.writeFile(backupPath, Buffer.from(data));
    } else {
      throw new Error("No database to backup");
    }
  }

  await pruneBackups();
  return filename;
}

export async function listBackups(): Promise<{ filename: string; size: number; date: string }[]> {
  if (DATABASE_MODE === "postgres") return [];

  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    const files = await fs.readdir(BACKUP_DIR);
    const backups: { filename: string; size: number; date: string }[] = [];

    for (const file of files) {
      if (!file.endsWith(".db")) continue;
      const stat = await fs.stat(path.join(BACKUP_DIR, file));
      backups.push({
        filename: file,
        size: stat.size,
        date: stat.mtime.toISOString(),
      });
    }

    backups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return backups;
  } catch {
    return [];
  }
}

export async function deleteBackup(filename: string): Promise<void> {
  const sanitized = path.basename(filename);
  if (!sanitized.endsWith(".db")) throw new Error("Invalid backup filename");
  const backupPath = path.join(BACKUP_DIR, sanitized);
  await fs.unlink(backupPath);
}

async function pruneBackups(): Promise<void> {
  const backups = await listBackups();
  if (backups.length > MAX_BACKUPS) {
    const toDelete = backups.slice(MAX_BACKUPS);
    for (const backup of toDelete) {
      try {
        await fs.unlink(path.join(BACKUP_DIR, backup.filename));
      } catch {}
    }
  }
}

// ── SQLite schema (unchanged from original) ───────────────────────────

function initSqliteSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scope_documents (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id),
      fleet_name TEXT NOT NULL DEFAULT 'New Fleet',
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','active','archived')),
      share_token TEXT UNIQUE,
      share_access TEXT DEFAULT 'disabled' CHECK(share_access IN ('disabled','viewer','restricted')),
      sf_opportunity_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scope_collaborators (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      role TEXT NOT NULL DEFAULT 'viewer' CHECK(role IN ('owner','editor','viewer')),
      invited_at TEXT DEFAULT (datetime('now')),
      UNIQUE(scope_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS fleet_overview (
      id TEXT PRIMARY KEY,
      scope_id TEXT UNIQUE NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      hq_location TEXT,
      company_website TEXT,
      ps_platform TEXT DEFAULT 'PS Enterprise',
      fleet_timezone TEXT,
      current_technology TEXT,
      fleet_persona TEXT,
      num_drivers INTEGER,
      num_tractors INTEGER,
      num_trailers INTEGER,
      fleet_size_label TEXT,
      type_of_company TEXT,
      type_of_operation TEXT,
      current_tsp TEXT,
      current_tms TEXT,
      current_tms_type TEXT,
      current_tms_version TEXT,
      future_tms TEXT,
      future_tms_type TEXT,
      future_tms_version TEXT,
      workflow_current TEXT,
      workflow_future TEXT,
      workflow_integrator_current TEXT,
      workflow_integrator_future TEXT,
      systems_integrator_current TEXT,
      systems_integrator_future TEXT,
      executive_sponsor_name TEXT,
      executive_sponsor_title TEXT,
      account_executive TEXT,
      date_lead_provided TEXT,
      contract_link TEXT,
      sf_opportunity_link TEXT,
      master_notes_link TEXT,
      customer_dossier_link TEXT,
      account_temperature TEXT,
      temperature_comments TEXT,
      operating_companies INTEGER,
      offices_terminals INTEGER,
      border_crossing TEXT,
      other_hardware_used TEXT,
      other_hardware_needed TEXT,
      tpms TEXT,
      trailer_tracking TEXT,
      freight_visibility TEXT,
      lane_departure TEXT,
      incab_navigation TEXT,
      trailer_tracking_tms TEXT,
      video_safety TEXT,
      load_optimization TEXT,
      lms TEXT,
      trailer_temp TEXT,
      video_camera TEXT,
      quotes TEXT,
      fuel_management TEXT,
      scanning TEXT,
      incab_safety TEXT,
      route_compliance TEXT,
      fuel_tax TEXT,
      truck_stop TEXT,
      incab_coaching TEXT,
      mdm TEXT,
      fuel_optimization TEXT,
      maintenance TEXT,
      training_tech TEXT,
      speed_control TEXT,
      fuel_cards TEXT,
      weigh_station TEXT,
      compliance TEXT,
      speeding_posted TEXT,
      driver_companion TEXT,
      scales TEXT,
      payroll TEXT,
      incab_wellness TEXT,
      hardware_json TEXT DEFAULT '[]',
      vehicles_json TEXT DEFAULT '[]',
      vehicle_list_link TEXT,
      has_tankers TEXT,
      single_compartments TEXT,
      multiple_compartments TEXT,
      rented_foreign_trailers TEXT,
      use_containers TEXT,
      use_chassis TEXT,
      parcel_shipments TEXT,
      multi_stop_orders TEXT,
      commodities_hauled TEXT,
      multi_mode_transport TEXT,
      split_loads TEXT,
      multi_leg_shipments TEXT,
      freight_via_rail TEXT,
      petroleum_liquids TEXT,
      consolidate_loads TEXT,
      pickup_dropoff_process TEXT
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      contact_type TEXT NOT NULL CHECK(contact_type IN ('ps_team','fleet')),
      role_title TEXT,
      name TEXT,
      title TEXT,
      email TEXT,
      phone TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS marketplace_apps (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      product_name TEXT NOT NULL,
      partner_account TEXT,
      solution_type TEXT,
      partner_category TEXT,
      partner_subcategory TEXT,
      description TEXT,
      value_proposition TEXT,
      stage TEXT,
      selected INTEGER DEFAULT 0,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS user_provided_apps (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      use_case TEXT,
      apk_or_website TEXT CHECK(apk_or_website IN ('APK','Website',NULL)),
      website_url TEXT,
      has_deeplink INTEGER DEFAULT 0,
      deeplink_description TEXT,
      comments TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS solution_features (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      feature_name TEXT NOT NULL,
      needed INTEGER DEFAULT 0,
      num_licenses INTEGER,
      required_for_quote INTEGER DEFAULT 0,
      required_for_pilot INTEGER DEFAULT 0,
      required_for_production INTEGER DEFAULT 0,
      notes TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS gaps (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      gap_number INTEGER,
      gap_identified TEXT,
      use_case TEXT,
      bd_team_engaged INTEGER DEFAULT 0,
      product_team_engaged INTEGER DEFAULT 0,
      se_use_case_link TEXT,
      psop_ticket TEXT,
      customer_blocker INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS workshop_questions (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      sub_category TEXT,
      question TEXT,
      response TEXT,
      comments TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS training_questions (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      training_type TEXT,
      training_personnel TEXT,
      sub_category TEXT,
      question TEXT,
      response TEXT,
      comments TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS scope_forms (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      form_number INTEGER,
      form_name TEXT,
      purpose TEXT,
      used_in_workflow INTEGER DEFAULT 0,
      driver_or_dispatch TEXT,
      driver_response_expected INTEGER DEFAULT 0,
      form_category TEXT,
      decision_tree_logic INTEGER DEFAULT 0,
      stored_procedures INTEGER DEFAULT 0,
      stored_procedure_desc TEXT,
      form_type TEXT DEFAULT 'ps_plus' CHECK(form_type IN ('ps_plus','pse','general')),
      form_fields TEXT DEFAULT '[]',
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS workflow_integration (
      id TEXT PRIMARY KEY,
      scope_id TEXT UNIQUE NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      data_json TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS install_forecasts (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      forecasted INTEGER DEFAULT 0,
      actual INTEGER DEFAULT 0,
      UNIQUE(scope_id, year, month)
    );

    CREATE TABLE IF NOT EXISTS ref_marketplace_products (
      id TEXT PRIMARY KEY,
      product_name TEXT NOT NULL,
      partner_account TEXT,
      solution_type TEXT,
      partner_category TEXT,
      partner_subcategory TEXT,
      product_description TEXT,
      bd_description TEXT,
      value_proposition TEXT,
      stage TEXT
    );

    CREATE TABLE IF NOT EXISTS ref_master_data (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      value TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ref_km_marketplace (
      id TEXT PRIMARY KEY,
      app_name TEXT NOT NULL,
      category TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS completion_config (
      id TEXT PRIMARY KEY,
      tab_key TEXT UNIQUE NOT NULL,
      config_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS access_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      action TEXT NOT NULL DEFAULT 'login',
      detail TEXT,
      ip_address TEXT,
      city TEXT,
      region TEXT,
      country TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      section TEXT NOT NULL,
      action TEXT NOT NULL,
      before_json TEXT,
      after_json TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scope_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      template_json TEXT NOT NULL DEFAULT '{}',
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scope_comments (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      section TEXT,
      user_id TEXT NOT NULL REFERENCES users(id),
      text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      scope_id TEXT REFERENCES scope_documents(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workflow_technical (
      id TEXT PRIMARY KEY,
      scope_id TEXT UNIQUE NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      pse_hostname_prod TEXT,
      pse_hostname_dev TEXT,
      pse_db_name_prod TEXT,
      pse_db_name_dev TEXT,
      pse_access_level_prod TEXT,
      pse_access_level_dev TEXT,
      pse_totalmail_tz TEXT,
      pse_tm_ip TEXT,
      pse_tm_username TEXT,
      pse_tm_password TEXT,
      pse_tms_name TEXT,
      pse_db_hostname TEXT,
      pse_db_name TEXT,
      pse_server_tz TEXT,
      tms_access_level TEXT,
      tms_ip_address TEXT,
      tms_username TEXT,
      tms_password TEXT,
      tms_telematics_provided TEXT,
      tms_portal_url TEXT,
      tms_portal_username TEXT,
      tms_portal_password TEXT,
      psplus_cid_prod TEXT,
      psplus_cid_test TEXT,
      psplus_cid_dev TEXT,
      psplus_ip_whitelist TEXT,
      psplus_integration_username TEXT,
      psplus_integration_pw TEXT,
      psplus_enterprise_id TEXT,
      tech_tpms TEXT,
      tech_trailer_tracking TEXT,
      tech_freight_visibility TEXT,
      tech_lane_departure TEXT,
      tech_incab_navigation TEXT,
      tech_trailer_tracking_tms TEXT,
      tech_video_safety TEXT,
      tech_load_optimization TEXT,
      tech_lms TEXT,
      tech_trailer_temp TEXT,
      tech_video_camera TEXT,
      tech_quotes TEXT,
      tech_fuel_management TEXT,
      tech_scanning TEXT,
      tech_incab_safety TEXT,
      tech_route_compliance TEXT,
      tech_fuel_tax TEXT,
      tech_truck_stop TEXT,
      tech_incab_coaching TEXT,
      tech_mdm TEXT,
      tech_fuel_optimization TEXT,
      tech_maintenance TEXT,
      tech_training TEXT,
      tech_speed_control TEXT,
      tech_fuel_cards TEXT,
      tech_weigh_station TEXT,
      tech_compliance TEXT,
      tech_speeding_posted TEXT,
      tech_driver_companion TEXT,
      tech_scales TEXT,
      tech_payroll TEXT,
      tech_incab_wellness TEXT,
      tech_custom TEXT
    );
  `);

  saveDb();
}

function runMigrations(db: Database) {
  // Add is_admin column to users
  try { db.run("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0"); } catch {}

  // Add completion_config table for existing databases
  try {
    db.run(`CREATE TABLE IF NOT EXISTS completion_config (
      id TEXT PRIMARY KEY,
      tab_key TEXT UNIQUE NOT NULL,
      config_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT DEFAULT (datetime('now'))
    )`);
  } catch {}

  // Add access_log table for existing databases
  try {
    db.run(`CREATE TABLE IF NOT EXISTS access_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      action TEXT NOT NULL DEFAULT 'login',
      detail TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);
  } catch {}

  // Add detail column to access_log for existing databases
  try { db.run("ALTER TABLE access_log ADD COLUMN detail TEXT"); } catch {}

  // Add IP/geo/UA columns to access_log
  try { db.run("ALTER TABLE access_log ADD COLUMN ip_address TEXT"); } catch {}
  try { db.run("ALTER TABLE access_log ADD COLUMN city TEXT"); } catch {}
  try { db.run("ALTER TABLE access_log ADD COLUMN region TEXT"); } catch {}
  try { db.run("ALTER TABLE access_log ADD COLUMN country TEXT"); } catch {}
  try { db.run("ALTER TABLE access_log ADD COLUMN user_agent TEXT"); } catch {}

  // Add last_login_at column to users
  try { db.run("ALTER TABLE users ADD COLUMN last_login_at TEXT"); } catch {}

  const techAppCols = [
    "tech_tpms","tech_trailer_tracking","tech_freight_visibility","tech_lane_departure",
    "tech_incab_navigation","tech_trailer_tracking_tms","tech_video_safety","tech_load_optimization",
    "tech_lms","tech_trailer_temp","tech_video_camera","tech_quotes",
    "tech_fuel_management","tech_scanning","tech_incab_safety","tech_route_compliance",
    "tech_fuel_tax","tech_truck_stop","tech_incab_coaching","tech_mdm",
    "tech_fuel_optimization","tech_maintenance","tech_training","tech_speed_control",
    "tech_fuel_cards","tech_weigh_station","tech_compliance","tech_speeding_posted",
    "tech_driver_companion","tech_scales","tech_payroll","tech_incab_wellness",
    "tech_custom",
  ];
  let changed = false;
  for (const col of techAppCols) {
    try { db.run(`ALTER TABLE workflow_technical ADD COLUMN ${col} TEXT`); changed = true; } catch {}
  }
  if (changed) saveDb();

  // Backfill Executive Sponsor fleet contact for scopes that don't have one
  try {
    const missing = db.exec(`
      SELECT sd.id FROM scope_documents sd
      WHERE NOT EXISTS (
        SELECT 1 FROM contacts c
        WHERE c.scope_id = sd.id
          AND c.contact_type = 'fleet'
          AND c.role_title = 'Executive Sponsor'
      )
    `);
    if (missing.length && missing[0].values.length) {
      for (const row of missing[0].values) {
        const scopeId = row[0] as string;
        const contactId = crypto.randomUUID();
        db.run(
          `INSERT INTO contacts (id, scope_id, contact_type, role_title, sort_order)
           VALUES (?, ?, 'fleet', 'Executive Sponsor', 0)`,
          [contactId, scopeId]
        );
      }
      saveDb();
    }
  } catch {}

  // Add audit_log table
  try {
    db.run(`CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      section TEXT NOT NULL,
      action TEXT NOT NULL,
      before_json TEXT,
      after_json TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);
  } catch {}

  // Add scope_templates table
  try {
    db.run(`CREATE TABLE IF NOT EXISTS scope_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      template_json TEXT NOT NULL DEFAULT '{}',
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    )`);
  } catch {}

  // Add scope_comments table
  try {
    db.run(`CREATE TABLE IF NOT EXISTS scope_comments (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      section TEXT,
      user_id TEXT NOT NULL REFERENCES users(id),
      text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`);
  } catch {}

  // Add notifications table
  try {
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      scope_id TEXT REFERENCES scope_documents(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`);
  } catch {}

  // Reset any scopes incorrectly set to 'active' back to 'draft'
  try {
    db.run("UPDATE scope_documents SET status = 'draft' WHERE status = 'active'");
    saveDb();
  } catch {}
}

// ── Postgres schema init ──────────────────────────────────────────────

async function initPostgresSchema(db: DbAdapter) {
  // Each CREATE TABLE must be a separate statement for pg
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      is_admin INTEGER NOT NULL DEFAULT 0,
      last_login_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS scope_documents (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id),
      fleet_name TEXT NOT NULL DEFAULT 'New Fleet',
      status TEXT DEFAULT 'draft',
      share_token TEXT UNIQUE,
      share_access TEXT DEFAULT 'disabled',
      sf_opportunity_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS scope_collaborators (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      role TEXT NOT NULL DEFAULT 'viewer',
      invited_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(scope_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS fleet_overview (
      id TEXT PRIMARY KEY,
      scope_id TEXT UNIQUE NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      hq_location TEXT,
      company_website TEXT,
      ps_platform TEXT DEFAULT 'PS Enterprise',
      fleet_timezone TEXT,
      current_technology TEXT,
      fleet_persona TEXT,
      num_drivers INTEGER,
      num_tractors INTEGER,
      num_trailers INTEGER,
      fleet_size_label TEXT,
      type_of_company TEXT,
      type_of_operation TEXT,
      current_tsp TEXT,
      current_tms TEXT,
      current_tms_type TEXT,
      current_tms_version TEXT,
      future_tms TEXT,
      future_tms_type TEXT,
      future_tms_version TEXT,
      workflow_current TEXT,
      workflow_future TEXT,
      workflow_integrator_current TEXT,
      workflow_integrator_future TEXT,
      systems_integrator_current TEXT,
      systems_integrator_future TEXT,
      executive_sponsor_name TEXT,
      executive_sponsor_title TEXT,
      account_executive TEXT,
      date_lead_provided TEXT,
      contract_link TEXT,
      sf_opportunity_link TEXT,
      master_notes_link TEXT,
      customer_dossier_link TEXT,
      account_temperature TEXT,
      temperature_comments TEXT,
      operating_companies INTEGER,
      offices_terminals INTEGER,
      border_crossing TEXT,
      other_hardware_used TEXT,
      other_hardware_needed TEXT,
      tpms TEXT,
      trailer_tracking TEXT,
      freight_visibility TEXT,
      lane_departure TEXT,
      incab_navigation TEXT,
      trailer_tracking_tms TEXT,
      video_safety TEXT,
      load_optimization TEXT,
      lms TEXT,
      trailer_temp TEXT,
      video_camera TEXT,
      quotes TEXT,
      fuel_management TEXT,
      scanning TEXT,
      incab_safety TEXT,
      route_compliance TEXT,
      fuel_tax TEXT,
      truck_stop TEXT,
      incab_coaching TEXT,
      mdm TEXT,
      fuel_optimization TEXT,
      maintenance TEXT,
      training_tech TEXT,
      speed_control TEXT,
      fuel_cards TEXT,
      weigh_station TEXT,
      compliance TEXT,
      speeding_posted TEXT,
      driver_companion TEXT,
      scales TEXT,
      payroll TEXT,
      incab_wellness TEXT,
      hardware_json TEXT DEFAULT '[]',
      vehicles_json TEXT DEFAULT '[]',
      vehicle_list_link TEXT,
      has_tankers TEXT,
      single_compartments TEXT,
      multiple_compartments TEXT,
      rented_foreign_trailers TEXT,
      use_containers TEXT,
      use_chassis TEXT,
      parcel_shipments TEXT,
      multi_stop_orders TEXT,
      commodities_hauled TEXT,
      multi_mode_transport TEXT,
      split_loads TEXT,
      multi_leg_shipments TEXT,
      freight_via_rail TEXT,
      petroleum_liquids TEXT,
      consolidate_loads TEXT,
      pickup_dropoff_process TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      contact_type TEXT NOT NULL,
      role_title TEXT,
      name TEXT,
      title TEXT,
      email TEXT,
      phone TEXT,
      sort_order INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS marketplace_apps (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      product_name TEXT NOT NULL,
      partner_account TEXT,
      solution_type TEXT,
      partner_category TEXT,
      partner_subcategory TEXT,
      description TEXT,
      value_proposition TEXT,
      stage TEXT,
      selected INTEGER DEFAULT 0,
      notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS user_provided_apps (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      use_case TEXT,
      apk_or_website TEXT,
      website_url TEXT,
      has_deeplink INTEGER DEFAULT 0,
      deeplink_description TEXT,
      comments TEXT,
      sort_order INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS solution_features (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      feature_name TEXT NOT NULL,
      needed INTEGER DEFAULT 0,
      num_licenses INTEGER,
      required_for_quote INTEGER DEFAULT 0,
      required_for_pilot INTEGER DEFAULT 0,
      required_for_production INTEGER DEFAULT 0,
      notes TEXT,
      sort_order INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS gaps (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      gap_number INTEGER,
      gap_identified TEXT,
      use_case TEXT,
      bd_team_engaged INTEGER DEFAULT 0,
      product_team_engaged INTEGER DEFAULT 0,
      se_use_case_link TEXT,
      psop_ticket TEXT,
      customer_blocker INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS workshop_questions (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      sub_category TEXT,
      question TEXT,
      response TEXT,
      comments TEXT,
      sort_order INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS training_questions (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      training_type TEXT,
      training_personnel TEXT,
      sub_category TEXT,
      question TEXT,
      response TEXT,
      comments TEXT,
      sort_order INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS scope_forms (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      form_number INTEGER,
      form_name TEXT,
      purpose TEXT,
      used_in_workflow INTEGER DEFAULT 0,
      driver_or_dispatch TEXT,
      driver_response_expected INTEGER DEFAULT 0,
      form_category TEXT,
      decision_tree_logic INTEGER DEFAULT 0,
      stored_procedures INTEGER DEFAULT 0,
      stored_procedure_desc TEXT,
      form_type TEXT DEFAULT 'ps_plus',
      form_fields TEXT DEFAULT '[]',
      sort_order INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS workflow_integration (
      id TEXT PRIMARY KEY,
      scope_id TEXT UNIQUE NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      data_json TEXT DEFAULT '{}'
    )`,
    `CREATE TABLE IF NOT EXISTS install_forecasts (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      forecasted INTEGER DEFAULT 0,
      actual INTEGER DEFAULT 0,
      UNIQUE(scope_id, year, month)
    )`,
    `CREATE TABLE IF NOT EXISTS ref_marketplace_products (
      id TEXT PRIMARY KEY,
      product_name TEXT NOT NULL,
      partner_account TEXT,
      solution_type TEXT,
      partner_category TEXT,
      partner_subcategory TEXT,
      product_description TEXT,
      bd_description TEXT,
      value_proposition TEXT,
      stage TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS ref_master_data (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      value TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS ref_km_marketplace (
      id TEXT PRIMARY KEY,
      app_name TEXT NOT NULL,
      category TEXT,
      description TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS completion_config (
      id TEXT PRIMARY KEY,
      tab_key TEXT UNIQUE NOT NULL,
      config_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS access_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      action TEXT NOT NULL DEFAULT 'login',
      detail TEXT,
      ip_address TEXT,
      city TEXT,
      region TEXT,
      country TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      section TEXT NOT NULL,
      action TEXT NOT NULL,
      before_json TEXT,
      after_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS scope_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      template_json TEXT NOT NULL DEFAULT '{}',
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS scope_comments (
      id TEXT PRIMARY KEY,
      scope_id TEXT NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      section TEXT,
      user_id TEXT NOT NULL REFERENCES users(id),
      text TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      scope_id TEXT REFERENCES scope_documents(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS workflow_technical (
      id TEXT PRIMARY KEY,
      scope_id TEXT UNIQUE NOT NULL REFERENCES scope_documents(id) ON DELETE CASCADE,
      pse_hostname_prod TEXT,
      pse_hostname_dev TEXT,
      pse_db_name_prod TEXT,
      pse_db_name_dev TEXT,
      pse_access_level_prod TEXT,
      pse_access_level_dev TEXT,
      pse_totalmail_tz TEXT,
      pse_tm_ip TEXT,
      pse_tm_username TEXT,
      pse_tm_password TEXT,
      pse_tms_name TEXT,
      pse_db_hostname TEXT,
      pse_db_name TEXT,
      pse_server_tz TEXT,
      tms_access_level TEXT,
      tms_ip_address TEXT,
      tms_username TEXT,
      tms_password TEXT,
      tms_telematics_provided TEXT,
      tms_portal_url TEXT,
      tms_portal_username TEXT,
      tms_portal_password TEXT,
      psplus_cid_prod TEXT,
      psplus_cid_test TEXT,
      psplus_cid_dev TEXT,
      psplus_ip_whitelist TEXT,
      psplus_integration_username TEXT,
      psplus_integration_pw TEXT,
      psplus_enterprise_id TEXT,
      tech_tpms TEXT,
      tech_trailer_tracking TEXT,
      tech_freight_visibility TEXT,
      tech_lane_departure TEXT,
      tech_incab_navigation TEXT,
      tech_trailer_tracking_tms TEXT,
      tech_video_safety TEXT,
      tech_load_optimization TEXT,
      tech_lms TEXT,
      tech_trailer_temp TEXT,
      tech_video_camera TEXT,
      tech_quotes TEXT,
      tech_fuel_management TEXT,
      tech_scanning TEXT,
      tech_incab_safety TEXT,
      tech_route_compliance TEXT,
      tech_fuel_tax TEXT,
      tech_truck_stop TEXT,
      tech_incab_coaching TEXT,
      tech_mdm TEXT,
      tech_fuel_optimization TEXT,
      tech_maintenance TEXT,
      tech_training TEXT,
      tech_speed_control TEXT,
      tech_fuel_cards TEXT,
      tech_weigh_station TEXT,
      tech_compliance TEXT,
      tech_speeding_posted TEXT,
      tech_driver_companion TEXT,
      tech_scales TEXT,
      tech_payroll TEXT,
      tech_incab_wellness TEXT,
      tech_custom TEXT
    )`,
  ];

  for (const ddl of tables) {
    await db.run(ddl);
  }
}
