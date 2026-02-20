import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { seedDatabase } from "@/lib/seed";
import {
  getScope, getUserRole, getOverview, getContacts, getMarketplaceApps,
  getUPAs, getFeatures, getGaps, getForms, getForecasts,
  getWorkshopQuestions, getTrainingQuestions, getWorkflowTechnical,
  getScopeStats,
} from "@/lib/scopes";

function esc(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await seedDatabase();
  const scopeId = params.id;
  const role = await getUserRole(scopeId, session.user.id);
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const scope = await getScope(scopeId);
  if (!scope) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [overview, contacts, marketplace, upas, features, gaps, forms, forecasts, workshop, training, wfTech, stats] = await Promise.all([
    getOverview(scopeId), getContacts(scopeId), getMarketplaceApps(scopeId),
    getUPAs(scopeId), getFeatures(scopeId), getGaps(scopeId),
    getForms(scopeId), getForecasts(scopeId), getWorkshopQuestions(scopeId),
    getTrainingQuestions(scopeId), getWorkflowTechnical(scopeId), getScopeStats(scopeId),
  ]);

  const ov = (overview || {}) as Record<string, unknown>;
  const sc = scope as Record<string, unknown>;
  const fleetName = esc(sc.fleet_name || "Scope");
  const status = esc(sc.status || "draft");
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const contactRows = (contacts as Record<string, unknown>[])
    .map(c => `<tr><td>${esc(c.contact_type === "ps_team" ? "PS Team" : "Fleet")}</td><td>${esc(c.role_title)}</td><td>${esc(c.name)}</td><td>${esc(c.email)}</td><td>${esc(c.phone)}</td></tr>`)
    .join("");

  const marketplaceRows = (marketplace as Record<string, unknown>[])
    .map(a => `<tr><td>${esc(a.product_name)}</td><td>${esc(a.partner_account)}</td><td>${esc(a.partner_category)}</td><td>${esc(a.stage)}</td><td>${esc(a.notes)}</td></tr>`)
    .join("");

  const upaRows = (upas as Record<string, unknown>[])
    .map(u => `<tr><td>${esc(u.name)}</td><td>${esc(u.website_url)}</td><td>${esc(u.use_case)}</td><td>${u.has_deeplink ? "Yes" : "No"}</td></tr>`)
    .join("");

  const featureRows = (features as Record<string, unknown>[])
    .map(f => `<tr><td>${esc(f.feature_name)}</td><td>${f.needed ? "Yes" : "No"}</td><td>${f.required_for_quote ? "Yes" : ""}</td><td>${f.required_for_pilot ? "Yes" : ""}</td><td>${f.required_for_production ? "Yes" : ""}</td><td>${esc(f.notes)}</td></tr>`)
    .join("");

  const gapRows = (gaps as Record<string, unknown>[])
    .map(g => `<tr><td>${esc(g.gap_number)}</td><td>${esc(g.gap_identified)}</td><td>${esc(g.use_case)}</td><td>${g.bd_team_engaged ? "Yes" : "No"}</td><td>${g.product_team_engaged ? "Yes" : "No"}</td><td>${g.customer_blocker ? "Yes" : "No"}</td><td>${esc(g.psop_ticket)}</td></tr>`)
    .join("");

  const workshopRows = (workshop as Record<string, unknown>[])
    .map(q => `<tr><td>${esc(q.sub_category)}</td><td>${esc(q.question)}</td><td>${esc(q.response)}</td><td>${esc(q.comments)}</td></tr>`)
    .join("");

  const trainingRows = (training as Record<string, unknown>[])
    .map(q => `<tr><td>${esc(q.sub_category)}</td><td>${esc(q.question)}</td><td>${esc(q.response)}</td><td>${esc(q.comments)}</td></tr>`)
    .join("");

  const formRows = (forms as Record<string, unknown>[])
    .map(f => {
      let fieldCount = 0;
      try { fieldCount = JSON.parse((f.form_fields as string) || "[]").length; } catch {}
      return `<tr><td>${esc(f.form_number)}</td><td>${esc(f.form_name)}</td><td>${esc(f.form_category)}</td><td>${esc(f.form_type)}</td><td>${esc(f.purpose)}</td><td>${f.used_in_workflow ? "Yes" : "No"}</td><td>${fieldCount}</td></tr>`;
    })
    .join("");

  const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const byYear: Record<number, Record<string, unknown>[]> = {};
  (forecasts as Record<string, unknown>[]).forEach(f => {
    const yr = f.year as number;
    if (!byYear[yr]) byYear[yr] = [];
    byYear[yr].push(f);
  });
  let forecastHtml = "";
  for (const [yr, fs] of Object.entries(byYear).sort(([a],[b]) => +a - +b)) {
    const sorted = (fs as Record<string, unknown>[]).sort((a, b) => (a.month as number) - (b.month as number));
    forecastHtml += `<h3>${yr}</h3><table><thead><tr><th>Type</th>${sorted.map(f => `<th>${M[(f.month as number) - 1]}</th>`).join("")}<th>Total</th></tr></thead><tbody>`;
    forecastHtml += `<tr><td>Forecast</td>${sorted.map(f => `<td>${f.forecasted || 0}</td>`).join("")}<td><strong>${sorted.reduce((a, f) => a + ((f.forecasted as number) || 0), 0)}</strong></td></tr>`;
    forecastHtml += `<tr><td>Actual</td>${sorted.map(f => `<td>${f.actual || 0}</td>`).join("")}<td><strong>${sorted.reduce((a, f) => a + ((f.actual as number) || 0), 0)}</strong></td></tr>`;
    forecastHtml += `</tbody></table>`;
  }

  let wfTechHtml = "";
  if (wfTech) {
    const wt = wfTech as Record<string, unknown>;
    const wtFields = [
      ["PSE Hostname (Prod)", wt.pse_hostname_prod], ["PSE Hostname (Dev)", wt.pse_hostname_dev],
      ["PSE DB Name (Prod)", wt.pse_db_name_prod], ["PSE DB Name (Dev)", wt.pse_db_name_dev],
      ["PSE Access Level (Prod)", wt.pse_access_level_prod], ["TMS Name", wt.pse_tms_name],
      ["TMS Access Level", wt.tms_access_level], ["TMS IP", wt.tms_ip_address],
      ["PS+ CID Prod", wt.psplus_cid_prod], ["PS+ CID Test", wt.psplus_cid_test],
      ["PS+ CID Dev", wt.psplus_cid_dev], ["PS+ Enterprise ID", wt.psplus_enterprise_id],
    ];
    wfTechHtml = wtFields
      .filter(([, v]) => v)
      .map(([f, v]) => `<tr><td>${esc(f)}</td><td>${esc(v)}</td></tr>`)
      .join("");
  }

  const st = stats as Record<string, unknown>;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${fleetName} - Solutions Scoping Document</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a1a1a; background: #fff; font-size: 11px; line-height: 1.5; padding: 0; }
  .print-bar { background: #1e3a5f; color: #fff; padding: 12px 32px; display: flex; align-items: center; justify-content: space-between; }
  .print-bar h1 { font-size: 14px; font-weight: 600; }
  .print-bar button { background: #fff; color: #1e3a5f; border: none; padding: 8px 20px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
  .print-bar button:hover { background: #e8edf3; }
  .content { max-width: 900px; margin: 0 auto; padding: 32px; }
  .header { text-align: center; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 3px solid #1e3a5f; }
  .header h1 { font-size: 22px; color: #1e3a5f; margin-bottom: 4px; }
  .header .meta { font-size: 12px; color: #666; }
  .header .meta span { margin: 0 8px; }
  .header .status { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .header .status-active { background: #d1fae5; color: #065f46; }
  .header .status-draft { background: #fef3c7; color: #92400e; }
  section { margin-bottom: 24px; page-break-inside: avoid; }
  section h2 { font-size: 14px; color: #1e3a5f; border-bottom: 2px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  section h3 { font-size: 12px; color: #374151; margin: 12px 0 6px; }
  .overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 16px; }
  .overview-grid .field { padding: 4px 0; border-bottom: 1px solid #f3f4f6; display: flex; }
  .overview-grid .field-label { font-weight: 600; color: #4b5563; min-width: 160px; flex-shrink: 0; }
  .overview-grid .field-value { color: #1a1a1a; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10px; }
  thead th { background: #1e3a5f; color: #fff; text-align: left; padding: 5px 8px; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
  tbody td { padding: 4px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  tbody tr:nth-child(even) { background: #f9fafb; }
  .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 16px; }
  .stat-box { text-align: center; padding: 10px 6px; border: 1px solid #e5e7eb; border-radius: 6px; }
  .stat-box .num { font-size: 20px; font-weight: 700; color: #1e3a5f; }
  .stat-box .label { font-size: 9px; color: #6b7280; text-transform: uppercase; }
  .empty-section { color: #9ca3af; font-style: italic; padding: 8px 0; }

  @media print {
    .print-bar { display: none !important; }
    body { padding: 0; font-size: 10px; }
    .content { max-width: none; padding: 16px; }
    section { page-break-inside: avoid; }
    .header { page-break-after: avoid; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="print-bar">
  <h1>${fleetName} - Scoping Document</h1>
  <button onclick="window.print()">Print / Save as PDF</button>
</div>
<div class="content">
  <div class="header">
    <h1>Solutions Scoping Document</h1>
    <div class="meta">
      <strong>${fleetName}</strong>
      <span>|</span>
      <span class="status status-${status === "active" ? "active" : "draft"}">${status}</span>
      <span>|</span>
      ${today}
    </div>
  </div>

  <section>
    <h2>Overview</h2>
    <div class="stats-grid">
      <div class="stat-box"><div class="num">${st.marketplace_apps}</div><div class="label">Marketplace Apps</div></div>
      <div class="stat-box"><div class="num">${st.upas}</div><div class="label">User Apps</div></div>
      <div class="stat-box"><div class="num">${st.forms}</div><div class="label">Forms</div></div>
      <div class="stat-box"><div class="num">${st.gaps}</div><div class="label">Gaps</div></div>
      <div class="stat-box"><div class="num">${st.features_needed}</div><div class="label">Features Needed</div></div>
    </div>
    <div class="overview-grid">
      ${[
        ["Fleet Name", fleetName], ["HQ Location", ov.hq_location], ["PS Platform", ov.ps_platform],
        ["Fleet Timezone", ov.fleet_timezone], ["Fleet Persona", ov.fleet_persona],
        ["Type of Company", ov.type_of_company], ["Type of Operation", ov.type_of_operation],
        ["# Drivers", ov.num_drivers], ["# Tractors", ov.num_tractors], ["# Trailers", ov.num_trailers],
        ["Fleet Size", ov.fleet_size_label], ["Current TSP", ov.current_tsp], ["Current TMS", ov.current_tms],
        ["Current TMS Type", ov.current_tms_type], ["Future TMS", ov.future_tms],
        ["Account Executive", ov.account_executive], ["Executive Sponsor", ov.executive_sponsor_name],
        ["Account Temperature", ov.account_temperature],
      ].map(([f, v]) => `<div class="field"><span class="field-label">${esc(f)}</span><span class="field-value">${esc(v) || "&mdash;"}</span></div>`).join("")}
    </div>
  </section>

  <section>
    <h2>Contacts</h2>
    ${contactRows ? `<table><thead><tr><th>Type</th><th>Role</th><th>Name</th><th>Email</th><th>Phone</th></tr></thead><tbody>${contactRows}</tbody></table>` : '<p class="empty-section">No contacts recorded.</p>'}
  </section>

  <section>
    <h2>Marketplace Apps</h2>
    ${marketplaceRows ? `<table><thead><tr><th>Product</th><th>Partner</th><th>Category</th><th>Stage</th><th>Notes</th></tr></thead><tbody>${marketplaceRows}</tbody></table>` : '<p class="empty-section">No marketplace apps.</p>'}
  </section>

  ${upaRows ? `<section>
    <h2>User Provided Apps</h2>
    <table><thead><tr><th>Name</th><th>Website URL</th><th>Use Case</th><th>Deeplink</th></tr></thead><tbody>${upaRows}</tbody></table>
  </section>` : ""}

  <section>
    <h2>Solution Mix</h2>
    ${featureRows ? `<table><thead><tr><th>Feature</th><th>Needed</th><th>Quote</th><th>Pilot</th><th>Production</th><th>Notes</th></tr></thead><tbody>${featureRows}</tbody></table>` : '<p class="empty-section">No features configured.</p>'}
  </section>

  <section>
    <h2>Gaps</h2>
    ${gapRows ? `<table><thead><tr><th>#</th><th>Gap Identified</th><th>Use Case</th><th>BD Engaged</th><th>Product Engaged</th><th>Blocker</th><th>PSOP Ticket</th></tr></thead><tbody>${gapRows}</tbody></table>` : '<p class="empty-section">No gaps identified.</p>'}
  </section>

  ${workshopRows ? `<section>
    <h2>Workshop Responses</h2>
    <table><thead><tr><th>Category</th><th>Question</th><th>Response</th><th>Comments</th></tr></thead><tbody>${workshopRows}</tbody></table>
  </section>` : ""}

  ${trainingRows ? `<section>
    <h2>Training Responses</h2>
    <table><thead><tr><th>Category</th><th>Question</th><th>Response</th><th>Comments</th></tr></thead><tbody>${trainingRows}</tbody></table>
  </section>` : ""}

  ${formRows ? `<section>
    <h2>Forms</h2>
    <table><thead><tr><th>#</th><th>Form Name</th><th>Category</th><th>Type</th><th>Purpose</th><th>Workflow</th><th># Fields</th></tr></thead><tbody>${formRows}</tbody></table>
  </section>` : ""}

  ${forecastHtml ? `<section>
    <h2>Install Forecast</h2>
    ${forecastHtml}
  </section>` : ""}

  ${wfTechHtml ? `<section>
    <h2>Workflow Technical Details</h2>
    <table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>${wfTechHtml}</tbody></table>
  </section>` : ""}

  <div style="margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 9px;">
    Generated from Solution Scoping Document &mdash; ${today}
  </div>
</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
