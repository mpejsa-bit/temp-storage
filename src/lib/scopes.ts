import { getDb, saveDb } from "./db";
import { generateId, generateShareToken, getFleetSizeLabel } from "./utils";
import { PS_FEATURES } from "./seed";
import { encrypt, decrypt } from "./crypto";

// ── Column whitelists ──────────────────────────────────────────────────
const ALLOWED_COLUMNS: Record<string, Set<string>> = {
  scope_documents: new Set([
    "fleet_name", "status", "share_token", "share_access",
    "sf_opportunity_id", "updated_at",
  ]),
  fleet_overview: new Set([
    "hq_location", "company_website", "ps_platform", "fleet_timezone",
    "current_technology", "fleet_persona", "num_drivers", "num_tractors",
    "num_trailers", "fleet_size_label", "type_of_company", "type_of_operation",
    "current_tsp", "current_tms", "current_tms_type", "current_tms_version",
    "future_tms", "future_tms_type", "future_tms_version",
    "workflow_current", "workflow_future",
    "workflow_integrator_current", "workflow_integrator_future",
    "systems_integrator_current", "systems_integrator_future",
    "executive_sponsor_name", "executive_sponsor_title", "account_executive",
    "date_lead_provided", "contract_link", "sf_opportunity_link",
    "master_notes_link", "customer_dossier_link",
    "account_temperature", "temperature_comments",
    "operating_companies", "offices_terminals", "border_crossing",
    "other_hardware_used", "other_hardware_needed",
    "tpms", "trailer_tracking", "freight_visibility", "lane_departure",
    "incab_navigation", "trailer_tracking_tms", "video_safety",
    "load_optimization", "lms", "trailer_temp", "video_camera", "quotes",
    "fuel_management", "scanning", "incab_safety", "route_compliance",
    "fuel_tax", "truck_stop", "incab_coaching", "mdm", "fuel_optimization",
    "maintenance", "training_tech", "speed_control", "fuel_cards",
    "weigh_station", "compliance", "speeding_posted", "driver_companion",
    "scales", "payroll", "incab_wellness",
    "hardware_json", "vehicles_json", "vehicle_list_link",
    "has_tankers", "single_compartments", "multiple_compartments",
    "rented_foreign_trailers", "use_containers", "use_chassis",
    "parcel_shipments", "multi_stop_orders", "commodities_hauled",
    "multi_mode_transport", "split_loads", "multi_leg_shipments",
    "freight_via_rail", "petroleum_liquids", "consolidate_loads",
    "pickup_dropoff_process",
  ]),
  contacts: new Set([
    "scope_id", "contact_type", "role_title", "name", "title", "email", "phone", "sort_order",
  ]),
  marketplace_apps: new Set([
    "scope_id", "product_name", "partner_account", "solution_type",
    "partner_category", "partner_subcategory", "description",
    "value_proposition", "stage", "selected", "notes",
  ]),
  user_provided_apps: new Set([
    "scope_id", "name", "use_case", "apk_or_website", "website_url",
    "has_deeplink", "deeplink_description", "comments", "sort_order",
  ]),
  solution_features: new Set([
    "scope_id", "feature_name", "needed", "num_licenses",
    "required_for_quote", "required_for_pilot", "required_for_production",
    "notes", "sort_order",
  ]),
  gaps: new Set([
    "scope_id", "gap_number", "gap_identified", "use_case",
    "bd_team_engaged", "product_team_engaged", "se_use_case_link",
    "psop_ticket", "customer_blocker", "sort_order",
  ]),
  workshop_questions: new Set([
    "scope_id", "sub_category", "question", "response", "comments", "sort_order",
  ]),
  training_questions: new Set([
    "scope_id", "training_type", "training_personnel", "sub_category",
    "question", "response", "comments", "sort_order",
  ]),
  scope_forms: new Set([
    "scope_id", "form_number", "form_name", "purpose", "used_in_workflow",
    "driver_or_dispatch", "driver_response_expected", "form_category",
    "decision_tree_logic", "stored_procedures", "stored_procedure_desc",
    "form_type", "form_fields", "sort_order",
  ]),
  install_forecasts: new Set([
    "scope_id", "year", "month", "forecasted", "actual",
  ]),
  workflow_technical: new Set([
    "pse_hostname_prod", "pse_hostname_dev", "pse_db_name_prod", "pse_db_name_dev",
    "pse_access_level_prod", "pse_access_level_dev", "pse_totalmail_tz",
    "pse_tm_ip", "pse_tm_username", "pse_tm_password",
    "pse_tms_name", "pse_db_hostname", "pse_db_name", "pse_server_tz",
    "tms_access_level", "tms_ip_address", "tms_username", "tms_password",
    "tms_telematics_provided", "tms_portal_url", "tms_portal_username",
    "tms_portal_password",
    "psplus_cid_prod", "psplus_cid_test", "psplus_cid_dev",
    "psplus_ip_whitelist", "psplus_integration_username",
    "psplus_integration_pw", "psplus_enterprise_id",
    "tech_tpms", "tech_trailer_tracking", "tech_freight_visibility", "tech_lane_departure",
    "tech_incab_navigation", "tech_trailer_tracking_tms", "tech_video_safety", "tech_load_optimization",
    "tech_lms", "tech_trailer_temp", "tech_video_camera", "tech_quotes",
    "tech_fuel_management", "tech_scanning", "tech_incab_safety", "tech_route_compliance",
    "tech_fuel_tax", "tech_truck_stop", "tech_incab_coaching", "tech_mdm",
    "tech_fuel_optimization", "tech_maintenance", "tech_training", "tech_speed_control",
    "tech_fuel_cards", "tech_weigh_station", "tech_compliance", "tech_speeding_posted",
    "tech_driver_companion", "tech_scales", "tech_payroll", "tech_incab_wellness",
    "tech_custom",
  ]),
};

const ALLOWED_TABLES = new Set([
  "contacts", "marketplace_apps", "user_provided_apps", "solution_features",
  "gaps", "workshop_questions", "training_questions", "scope_forms",
  "install_forecasts",
]);

const ENCRYPTED_FIELDS = [
  "pse_tm_password", "tms_password", "tms_portal_password", "psplus_integration_pw",
] as const;

const ENCRYPTED_FIELDS_SET = new Set<string>(ENCRYPTED_FIELDS);

function validateColumns(table: string, keys: string[]): void {
  const allowed = ALLOWED_COLUMNS[table];
  if (!allowed) throw new Error(`Unknown table: ${table}`);
  for (const key of keys) {
    if (!allowed.has(key)) {
      throw new Error(`Invalid column "${key}" for table "${table}"`);
    }
  }
}

export interface ScopeDocument {
  id: string;
  owner_id: string;
  fleet_name: string;
  status: string;
  share_token: string | null;
  share_access: string;
  sf_opportunity_id: string | null;
  created_at: string;
  updated_at: string;
  owner_name?: string;
  owner_email?: string;
  role?: string;
}

function rowToObj(columns: string[], values: unknown[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  columns.forEach((col, i) => (obj[col] = values[i]));
  return obj;
}

function execToObjects(result: { columns: string[]; values: unknown[][] }[]): Record<string, unknown>[] {
  if (!result.length) return [];
  return result[0].values.map((row) => rowToObj(result[0].columns, row));
}

export async function createScope(ownerId: string, fleetName: string) {
  const db = await getDb();
  const id = generateId();
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO scope_documents (id, owner_id, fleet_name, status, created_at, updated_at)
     VALUES (?, ?, ?, 'draft', ?, ?)`,
    [id, ownerId, fleetName, now, now]
  );

  db.run(
    `INSERT INTO scope_collaborators (id, scope_id, user_id, role, invited_at)
     VALUES (?, ?, ?, 'owner', ?)`,
    [generateId(), id, ownerId, now]
  );

  db.run(
    `INSERT INTO fleet_overview (id, scope_id, ps_platform) VALUES (?, ?, 'PS Enterprise')`,
    [generateId(), id]
  );

  db.run(
    `INSERT INTO workflow_integration (id, scope_id, data_json) VALUES (?, ?, '{}')`,
    [generateId(), id]
  );

  // Seed default features
  PS_FEATURES.forEach((feature, i) => {
    db.run(
      `INSERT INTO solution_features (id, scope_id, feature_name, needed, sort_order)
       VALUES (?, ?, ?, 0, ?)`,
      [generateId(), id, feature, i]
    );
  });

  // Seed install forecasts for 2025 and 2026
  for (const year of [2025, 2026]) {
    for (let month = 1; month <= 12; month++) {
      db.run(
        `INSERT INTO install_forecasts (id, scope_id, year, month, forecasted, actual)
         VALUES (?, ?, ?, ?, 0, 0)`,
        [generateId(), id, year, month]
      );
    }
  }

  // Seed default PS team contact rows
  const psRoles = [
    "Account Executive",
    "Solutions Engineer",
    "Solutions Architect Engineer",
    "Program Manager",
    "Customer Success Manager",
    "Field Engineer",
    "Implementer",
    "Trainer",
  ];
  psRoles.forEach((role, i) => {
    db.run(
      `INSERT INTO contacts (id, scope_id, contact_type, role_title, sort_order)
       VALUES (?, ?, 'ps_team', ?, ?)`,
      [generateId(), id, role, i]
    );
  });

  // Seed default fleet contact: Executive Sponsor
  db.run(
    `INSERT INTO contacts (id, scope_id, contact_type, role_title, sort_order)
     VALUES (?, ?, 'fleet', 'Executive Sponsor', 0)`,
    [generateId(), id]
  );

  saveDb();
  return id;
}

export interface SfPrePopulateData {
  sf_account_id?: string;
  hq_location?: string;
  company_website?: string;
  type_of_company?: string;
  account_executive?: string;
  sf_opportunity_link?: string;
  executive_sponsor_name?: string;
  executive_sponsor_title?: string;
  contacts?: Array<{
    name: string;
    title: string;
    email: string;
    phone: string;
    role_title: string;
  }>;
}

export async function createScopeWithSfData(
  ownerId: string,
  fleetName: string,
  sfData: SfPrePopulateData
) {
  // Create scope with all defaults first
  const id = await createScope(ownerId, fleetName);
  const db = await getDb();

  // Update fleet_overview with SF data
  const overviewUpdates: string[] = [];
  const overviewVals: unknown[] = [];

  const overviewFields: Record<string, unknown> = {
    fleet_name: fleetName,
    hq_location: sfData.hq_location,
    company_website: sfData.company_website,
    type_of_company: sfData.type_of_company,
    account_executive: sfData.account_executive,
    sf_opportunity_link: sfData.sf_opportunity_link,
    executive_sponsor_name: sfData.executive_sponsor_name,
    executive_sponsor_title: sfData.executive_sponsor_title,
  };

  for (const [key, val] of Object.entries(overviewFields)) {
    if (val !== undefined && val !== null && val !== "") {
      overviewUpdates.push(`${key} = ?`);
      overviewVals.push(val);
    }
  }

  if (overviewUpdates.length) {
    overviewVals.push(id);
    db.run(
      `UPDATE fleet_overview SET ${overviewUpdates.join(", ")} WHERE scope_id = ?`,
      overviewVals
    );
  }

  // Update scope_documents with SF account ID
  if (sfData.sf_account_id) {
    db.run(
      "UPDATE scope_documents SET sf_opportunity_id = ? WHERE id = ?",
      [sfData.sf_account_id, id]
    );
  }

  // Insert fleet contacts from Salesforce
  if (sfData.contacts && sfData.contacts.length > 0) {
    for (let i = 0; i < sfData.contacts.length; i++) {
      const c = sfData.contacts[i];
      db.run(
        `INSERT INTO contacts (id, scope_id, contact_type, role_title, name, title, email, phone, sort_order)
         VALUES (?, ?, 'fleet', ?, ?, ?, ?, ?, ?)`,
        [generateId(), id, c.role_title || c.title || "", c.name, c.title, c.email, c.phone, i]
      );
    }
  }

  saveDb();
  return id;
}

export async function listScopes(userId: string): Promise<ScopeDocument[]> {
  const db = await getDb();
  const result = db.exec(
    `SELECT sd.*, COALESCE(sc.role, 'viewer') as role, u.name as owner_name, u.email as owner_email
     FROM scope_documents sd
     LEFT JOIN scope_collaborators sc ON sc.scope_id = sd.id AND sc.user_id = ?
     JOIN users u ON u.id = sd.owner_id
     ORDER BY sd.updated_at DESC`,
    [userId]
  );
  return execToObjects(result) as unknown as ScopeDocument[];
}

export async function getScope(scopeId: string) {
  const db = await getDb();
  const result = db.exec("SELECT * FROM scope_documents WHERE id = ?", [scopeId]);
  const rows = execToObjects(result);
  return rows[0] || null;
}

export async function getScopeByToken(token: string) {
  const db = await getDb();
  const result = db.exec(
    "SELECT * FROM scope_documents WHERE share_token = ? AND share_access != 'disabled'",
    [token]
  );
  const rows = execToObjects(result);
  return rows[0] || null;
}

export async function getUserRole(scopeId: string, userId: string): Promise<string | null> {
  const db = await getDb();
  const result = db.exec(
    "SELECT role FROM scope_collaborators WHERE scope_id = ? AND user_id = ?",
    [scopeId, userId]
  );
  if (!result.length || !result[0].values.length) {
    // All users can edit all scopes
    const exists = db.exec("SELECT id FROM scope_documents WHERE id = ?", [scopeId]);
    if (exists.length && exists[0].values.length) return "editor";
    return null;
  }
  return result[0].values[0][0] as string;
}

export async function updateScope(scopeId: string, data: Record<string, unknown>) {
  const db = await getDb();
  const sets: string[] = [];
  const vals: unknown[] = [];

  const keys = Object.keys(data);
  validateColumns("scope_documents", keys);

  for (const [key, val] of Object.entries(data)) {
    sets.push(`${key} = ?`);
    vals.push(val);
  }
  sets.push("updated_at = ?");
  vals.push(new Date().toISOString());
  vals.push(scopeId);

  db.run(`UPDATE scope_documents SET ${sets.join(", ")} WHERE id = ?`, vals);
  saveDb();
}

export async function deleteScope(scopeId: string) {
  const db = await getDb();
  db.run("DELETE FROM scope_documents WHERE id = ?", [scopeId]);
  saveDb();
}

export async function cloneScope(scopeId: string, newOwnerId: string): Promise<string> {
  const db = await getDb();
  const scope = await getScope(scopeId);
  if (!scope) throw new Error("Scope not found");

  const newId = await createScope(
    newOwnerId,
    `${(scope as Record<string, unknown>).fleet_name} (Copy)`
  );

  // Helper: copy rows from a table, generating new IDs and replacing scope_id
  function copyRows(table: string, query: string, params: unknown[]) {
    const result = db.exec(query, params);
    if (!result.length) return;
    const cols = result[0].columns.filter((c) => c !== "id" && c !== "scope_id");
    for (const row of result[0].values) {
      const obj = rowToObj(result[0].columns, row);
      const placeholders = cols.map(() => "?").join(", ");
      const vals = cols.map((c) => obj[c]);
      db.run(
        `INSERT INTO ${table} (id, scope_id, ${cols.join(", ")}) VALUES (?, ?, ${placeholders})`,
        [generateId(), newId, ...vals]
      );
    }
  }

  // Helper: copy single-row table by updating existing row
  function copySingleRow(table: string, scopeKey = "scope_id") {
    const result = db.exec(`SELECT * FROM ${table} WHERE ${scopeKey} = ?`, [scopeId]);
    if (!result.length || !result[0].values.length) return;
    const obj = rowToObj(result[0].columns, result[0].values[0]);
    const cols = result[0].columns.filter((c) => c !== "id" && c !== scopeKey);
    if (!cols.length) return;
    const setStr = cols.map((c) => `${c} = ?`).join(", ");
    const vals = cols.map((c) => obj[c]);
    vals.push(newId);
    db.run(`UPDATE ${table} SET ${setStr} WHERE ${scopeKey} = ?`, vals);
  }

  copySingleRow("fleet_overview");
  copyRows("contacts", "SELECT * FROM contacts WHERE scope_id = ? AND contact_type = 'fleet'", [scopeId]);
  copyRows("user_provided_apps", "SELECT * FROM user_provided_apps WHERE scope_id = ?", [scopeId]);
  copyRows("marketplace_apps", "SELECT * FROM marketplace_apps WHERE scope_id = ?", [scopeId]);

  // Replace seeded defaults with source data
  db.run("DELETE FROM solution_features WHERE scope_id = ?", [newId]);
  copyRows("solution_features", "SELECT * FROM solution_features WHERE scope_id = ?", [scopeId]);

  copyRows("gaps", "SELECT * FROM gaps WHERE scope_id = ?", [scopeId]);
  copyRows("workshop_questions", "SELECT * FROM workshop_questions WHERE scope_id = ?", [scopeId]);
  copyRows("training_questions", "SELECT * FROM training_questions WHERE scope_id = ?", [scopeId]);
  copyRows("scope_forms", "SELECT * FROM scope_forms WHERE scope_id = ?", [scopeId]);

  db.run("DELETE FROM install_forecasts WHERE scope_id = ?", [newId]);
  copyRows("install_forecasts", "SELECT * FROM install_forecasts WHERE scope_id = ?", [scopeId]);

  copySingleRow("workflow_integration");

  // Copy workflow technical (insert row first if needed)
  const wfTech = db.exec("SELECT * FROM workflow_technical WHERE scope_id = ?", [scopeId]);
  if (wfTech.length && wfTech[0].values.length) {
    db.run("INSERT OR REPLACE INTO workflow_technical (id, scope_id) VALUES (?, ?)", [generateId(), newId]);
    copySingleRow("workflow_technical");
  }

  saveDb();
  return newId;
}

export async function enableSharing(scopeId: string) {
  const db = await getDb();
  const token = generateShareToken();
  db.run(
    "UPDATE scope_documents SET share_token = ?, share_access = 'viewer', updated_at = ? WHERE id = ?",
    [token, new Date().toISOString(), scopeId]
  );
  saveDb();
  return token;
}

export async function disableSharing(scopeId: string) {
  const db = await getDb();
  db.run(
    "UPDATE scope_documents SET share_access = 'disabled', updated_at = ? WHERE id = ?",
    [new Date().toISOString(), scopeId]
  );
  saveDb();
}

export async function getOverview(scopeId: string) {
  const db = await getDb();
  const result = db.exec("SELECT * FROM fleet_overview WHERE scope_id = ?", [scopeId]);
  return execToObjects(result)[0] || null;
}

export async function updateOverview(scopeId: string, data: Record<string, unknown>) {
  const db = await getDb();
  const sets: string[] = [];
  const vals: unknown[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (key === "id" || key === "scope_id" || key === "fleet_name" || key === "fleet_size_label") continue;
    if (!ALLOWED_COLUMNS.fleet_overview.has(key)) {
      throw new Error(`Invalid column "${key}" for table "fleet_overview"`);
    }
    sets.push(`${key} = ?`);
    vals.push(val);
  }
  if (!sets.length) return;
  vals.push(scopeId);
  db.run(`UPDATE fleet_overview SET ${sets.join(", ")} WHERE scope_id = ?`, vals);

  // Update fleet_name on scope_documents if fleet name changed via overview
  if (data.fleet_name) {
    db.run("UPDATE scope_documents SET fleet_name = ?, updated_at = ? WHERE id = ?", [
      data.fleet_name,
      new Date().toISOString(),
      scopeId,
    ]);
  }

  // Compute fleet size label
  if (data.num_tractors !== undefined) {
    const label = getFleetSizeLabel(data.num_tractors as number);
    db.run("UPDATE fleet_overview SET fleet_size_label = ? WHERE scope_id = ?", [label, scopeId]);
  }

  saveDb();
}

export async function getContacts(scopeId: string) {
  const db = await getDb();
  return execToObjects(
    db.exec("SELECT * FROM contacts WHERE scope_id = ? ORDER BY contact_type, sort_order", [scopeId])
  );
}

export async function getMarketplaceApps(scopeId: string) {
  const db = await getDb();
  return execToObjects(
    db.exec("SELECT * FROM marketplace_apps WHERE scope_id = ? ORDER BY product_name", [scopeId])
  );
}

export async function getUPAs(scopeId: string) {
  const db = await getDb();
  return execToObjects(
    db.exec("SELECT * FROM user_provided_apps WHERE scope_id = ? ORDER BY sort_order", [scopeId])
  );
}

export async function getFeatures(scopeId: string) {
  const db = await getDb();
  return execToObjects(
    db.exec("SELECT * FROM solution_features WHERE scope_id = ? ORDER BY sort_order", [scopeId])
  );
}

export async function getGaps(scopeId: string) {
  const db = await getDb();
  return execToObjects(
    db.exec("SELECT * FROM gaps WHERE scope_id = ? ORDER BY sort_order", [scopeId])
  );
}

export async function getTrainingQuestions(scopeId: string) {
  const db = await getDb();
  return execToObjects(
    db.exec("SELECT * FROM training_questions WHERE scope_id = ? ORDER BY sort_order", [scopeId])
  );
}

export async function getWorkflowTechnical(scopeId: string) {
  const db = await getDb();
  const rows = execToObjects(
    db.exec("SELECT * FROM workflow_technical WHERE scope_id = ?", [scopeId])
  );
  const row = rows[0] || null;
  if (row) {
    for (const field of ENCRYPTED_FIELDS) {
      const val = row[field];
      if (typeof val === "string" && val.length > 0) {
        try {
          row[field] = decrypt(val);
        } catch {
          // Value may not be encrypted yet (pre-migration data) — hide it
          row[field] = "";
        }
      }
    }
  }
  return row;
}

export async function upsertWorkflowTechnical(scopeId: string, data: Record<string, unknown>) {
  const db = await getDb();

  // Validate and encrypt
  const processedData: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (key === "id" || key === "scope_id") continue;
    if (!ALLOWED_COLUMNS.workflow_technical.has(key)) {
      throw new Error(`Invalid column "${key}" for table "workflow_technical"`);
    }
    if (ENCRYPTED_FIELDS_SET.has(key) && typeof val === "string" && val.length > 0) {
      processedData[key] = encrypt(val);
    } else {
      processedData[key] = val;
    }
  }

  const existing = db.exec("SELECT id FROM workflow_technical WHERE scope_id = ?", [scopeId]);
  if (!(existing.length && existing[0].values.length)) {
    const id = generateId();
    db.run("INSERT INTO workflow_technical (id, scope_id) VALUES (?, ?)", [id, scopeId]);
  }

  const sets: string[] = [];
  const vals: unknown[] = [];
  for (const [key, val] of Object.entries(processedData)) {
    sets.push(`${key} = ?`);
    vals.push(val);
  }
  if (sets.length) {
    vals.push(scopeId);
    db.run(`UPDATE workflow_technical SET ${sets.join(", ")} WHERE scope_id = ?`, vals);
  }
  saveDb();
}

export async function getForms(scopeId: string) {
  const db = await getDb();
  return execToObjects(
    db.exec("SELECT * FROM scope_forms WHERE scope_id = ? ORDER BY sort_order", [scopeId])
  );
}

export async function getWorkflow(scopeId: string) {
  const db = await getDb();
  const rows = execToObjects(
    db.exec("SELECT * FROM workflow_integration WHERE scope_id = ?", [scopeId])
  );
  return rows[0] || null;
}

export async function getForecasts(scopeId: string) {
  const db = await getDb();
  return execToObjects(
    db.exec("SELECT * FROM install_forecasts WHERE scope_id = ? ORDER BY year, month", [scopeId])
  );
}

export async function getWorkshopQuestions(scopeId: string) {
  const db = await getDb();
  return execToObjects(
    db.exec("SELECT * FROM workshop_questions WHERE scope_id = ? ORDER BY sort_order", [scopeId])
  );
}

export async function getCollaborators(scopeId: string) {
  const db = await getDb();
  return execToObjects(
    db.exec(
      `SELECT sc.*, u.name, u.email FROM scope_collaborators sc
       JOIN users u ON u.id = sc.user_id
       WHERE sc.scope_id = ? ORDER BY sc.role`,
      [scopeId]
    )
  );
}

export async function addCollaborator(scopeId: string, email: string, role: string) {
  const db = await getDb();
  const userResult = db.exec("SELECT id FROM users WHERE email = ?", [email]);
  if (!userResult.length || !userResult[0].values.length) {
    throw new Error("User not found");
  }
  const userId = userResult[0].values[0][0] as string;
  db.run(
    `INSERT OR REPLACE INTO scope_collaborators (id, scope_id, user_id, role, invited_at)
     VALUES (?, ?, ?, ?, ?)`,
    [generateId(), scopeId, userId, role, new Date().toISOString()]
  );
  saveDb();
}

export async function removeCollaborator(scopeId: string, userId: string) {
  const db = await getDb();
  db.run("DELETE FROM scope_collaborators WHERE scope_id = ? AND user_id = ? AND role != 'owner'", [
    scopeId,
    userId,
  ]);
  saveDb();
}

export async function getScopeStats(scopeId: string) {
  const db = await getDb();
  const apps = db.exec("SELECT COUNT(*) FROM marketplace_apps WHERE scope_id = ? AND selected = 1", [scopeId]);
  const upas = db.exec("SELECT COUNT(*) FROM user_provided_apps WHERE scope_id = ?", [scopeId]);
  const forms = db.exec("SELECT COUNT(*) FROM scope_forms WHERE scope_id = ?", [scopeId]);
  const gaps = db.exec("SELECT COUNT(*) FROM gaps WHERE scope_id = ? AND gap_identified IS NOT NULL", [scopeId]);
  const features = db.exec("SELECT COUNT(*) FROM solution_features WHERE scope_id = ? AND needed = 1", [scopeId]);

  // Form category breakdown (Stats!B6:B12 = COUNTIF)
  const catRows = db.exec(
    "SELECT form_category, COUNT(*) as cnt FROM scope_forms WHERE scope_id = ? GROUP BY form_category",
    [scopeId]
  );
  const form_categories: Record<string, number> = {};
  if (catRows.length && catRows[0].values) {
    for (const row of catRows[0].values) {
      form_categories[row[0] as string || "Uncategorized"] = row[1] as number;
    }
  }

  return {
    marketplace_apps: apps.length ? (apps[0].values[0][0] as number) : 0,
    upas: upas.length ? (upas[0].values[0][0] as number) : 0,
    forms: forms.length ? (forms[0].values[0][0] as number) : 0,
    gaps: gaps.length ? (gaps[0].values[0][0] as number) : 0,
    features_needed: features.length ? (features[0].values[0][0] as number) : 0,
    form_categories,
  };
}

export async function getRefMarketplaceProducts() {
  const db = await getDb();
  return execToObjects(db.exec("SELECT * FROM ref_marketplace_products ORDER BY product_name"));
}

export async function getRefMasterData(category?: string) {
  const db = await getDb();
  if (category) {
    return execToObjects(
      db.exec("SELECT * FROM ref_master_data WHERE category = ? ORDER BY sort_order", [category])
    );
  }
  return execToObjects(db.exec("SELECT * FROM ref_master_data ORDER BY category, sort_order"));
}

// Generic table update helper
export async function upsertRow(table: string, data: Record<string, unknown>) {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`Table "${table}" is not allowed`);
  }
  const db = await getDb();
  const id = (data.id as string) || generateId();
  const cols = Object.keys(data).filter((k) => k !== "id");
  validateColumns(table, cols);
  const placeholders = cols.map(() => "?").join(", ");
  const values = cols.map((k) => data[k]);

  // Try update first
  if (data.id) {
    const sets = cols.map((c) => `${c} = ?`).join(", ");
    db.run(`UPDATE ${table} SET ${sets} WHERE id = ?`, [...values, id]);
  } else {
    db.run(
      `INSERT INTO ${table} (id, ${cols.join(", ")}) VALUES (?, ${placeholders})`,
      [id, ...values]
    );
  }
  saveDb();
  return id;
}

// ── Completion Config ─────────────────────────────────────────────────
export interface TabCompletionConfig {
  required_fields: string[];
  min_rows?: number;
}

export async function getCompletionConfig(): Promise<Record<string, TabCompletionConfig>> {
  const db = await getDb();
  const result = db.exec("SELECT tab_key, config_json FROM completion_config");
  const config: Record<string, TabCompletionConfig> = {};
  if (result.length) {
    for (const row of result[0].values) {
      const tabKey = row[0] as string;
      try {
        config[tabKey] = JSON.parse(row[1] as string);
      } catch {
        config[tabKey] = { required_fields: [] };
      }
    }
  }
  return config;
}

export async function upsertCompletionConfig(tabKey: string, tabConfig: TabCompletionConfig): Promise<void> {
  const db = await getDb();
  const configJson = JSON.stringify(tabConfig);
  const now = new Date().toISOString();
  const existing = db.exec("SELECT id FROM completion_config WHERE tab_key = ?", [tabKey]);
  if (existing.length && existing[0].values.length) {
    db.run("UPDATE completion_config SET config_json = ?, updated_at = ? WHERE tab_key = ?", [configJson, now, tabKey]);
  } else {
    db.run("INSERT INTO completion_config (id, tab_key, config_json, updated_at) VALUES (?, ?, ?, ?)", [generateId(), tabKey, configJson, now]);
  }
  saveDb();
}

// ── Admin Role ────────────────────────────────────────────────────────
export async function isUserAdmin(userId: string): Promise<boolean> {
  const db = await getDb();
  const result = db.exec("SELECT is_admin FROM users WHERE id = ?", [userId]);
  if (!result.length || !result[0].values.length) return false;
  return result[0].values[0][0] === 1;
}

export async function setUserAdmin(userId: string, isAdmin: boolean): Promise<void> {
  const db = await getDb();
  db.run("UPDATE users SET is_admin = ? WHERE id = ?", [isAdmin ? 1 : 0, userId]);
  saveDb();
}

// ── Access Tracking ───────────────────────────────────────────────────

export async function recordLogin(userId: string): Promise<void> {
  const db = await getDb();
  const id = generateId();
  const now = new Date().toISOString();
  db.run(
    "INSERT INTO access_log (id, user_id, action, created_at) VALUES (?, ?, 'login', ?)",
    [id, userId, now]
  );
  db.run("UPDATE users SET last_login_at = ? WHERE id = ?", [now, userId]);
  saveDb();
}

export interface ActivityMeta {
  detail?: string;
  ip?: string;
  userAgent?: string;
  city?: string;
  region?: string;
  country?: string;
}

export async function logActivity(userId: string, action: string, meta?: string | ActivityMeta): Promise<void> {
  const db = await getDb();
  // Support legacy string-only detail param
  const m: ActivityMeta = typeof meta === "string" ? { detail: meta } : (meta ?? {});
  db.run(
    `INSERT INTO access_log (id, user_id, action, detail, ip_address, city, region, country, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), userId, action, m.detail ?? null, m.ip ?? null, m.city ?? null, m.region ?? null, m.country ?? null, m.userAgent ?? null, new Date().toISOString()]
  );
  saveDb();
}

export async function getAllUsers(): Promise<Record<string, unknown>[]> {
  const db = await getDb();
  const result = db.exec(`
    SELECT u.id, u.name, u.email, u.is_admin, u.created_at, u.last_login_at,
           COUNT(al.id) as login_count
    FROM users u
    LEFT JOIN access_log al ON al.user_id = u.id AND al.action = 'login'
    GROUP BY u.id
    ORDER BY u.name COLLATE NOCASE
  `);
  return execToObjects(result);
}

export async function getRecentActivity(limit = 100): Promise<Record<string, unknown>[]> {
  const db = await getDb();
  const result = db.exec(
    `SELECT al.id, al.action, al.detail, al.ip_address, al.city, al.region, al.country, al.user_agent, al.created_at, u.name as user_name
     FROM access_log al
     JOIN users u ON u.id = al.user_id
     ORDER BY al.created_at DESC
     LIMIT ?`,
    [limit]
  );
  return execToObjects(result);
}

export async function deleteRow(table: string, id: string) {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`Table "${table}" is not allowed`);
  }
  const db = await getDb();
  db.run(`DELETE FROM ${table} WHERE id = ?`, [id]);
  saveDb();
}
