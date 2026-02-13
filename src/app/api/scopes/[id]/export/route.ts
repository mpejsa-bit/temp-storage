import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { seedDatabase } from "@/lib/seed";
import {
  getScope, getUserRole, getOverview, getContacts, getMarketplaceApps,
  getUPAs, getFeatures, getGaps, getForms, getForecasts,
  getWorkshopQuestions, getTrainingQuestions, getWorkflowTechnical,
  getScopeStats,
} from "@/lib/scopes";

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

  // Dynamic import to avoid bundling issues
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Scope Platform";

  const headerStyle = { font: { bold: true, color: { argb: "FFFFFFFF" } }, fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF1e3a5f" } } };
  const ov = (overview || {}) as Record<string, unknown>;
  const fleetName = (scope as Record<string, unknown>).fleet_name as string || "Scope";

  // --- Overview Sheet ---
  const ovSheet = workbook.addWorksheet("Overview");
  ovSheet.columns = [{ header: "Field", key: "field", width: 30 }, { header: "Value", key: "value", width: 50 }];
  ovSheet.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  const ovFields = [
    ["Fleet Name", fleetName], ["HQ Location", ov.hq_location], ["PS Platform", ov.ps_platform],
    ["Fleet Timezone", ov.fleet_timezone], ["Fleet Persona", ov.fleet_persona],
    ["Type of Company", ov.type_of_company], ["Type of Operation", ov.type_of_operation],
    ["# Drivers", ov.num_drivers], ["# Tractors", ov.num_tractors], ["# Trailers", ov.num_trailers],
    ["Fleet Size", ov.fleet_size_label], ["Current TSP", ov.current_tsp], ["Current TMS", ov.current_tms],
    ["Current TMS Type", ov.current_tms_type], ["Future TMS", ov.future_tms],
    ["Account Executive", ov.account_executive], ["Executive Sponsor", ov.executive_sponsor_name],
    ["Account Temperature", ov.account_temperature],
  ];
  ovFields.forEach(([f, v]) => ovSheet.addRow({ field: f, value: v ?? "" }));

  // --- Contacts Sheet ---
  const ctSheet = workbook.addWorksheet("Contacts");
  ctSheet.columns = [
    { header: "Type", key: "type", width: 15 }, { header: "Role", key: "role", width: 25 },
    { header: "Name", key: "name", width: 25 }, { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 20 },
  ];
  ctSheet.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  (contacts as Record<string, unknown>[]).forEach(c => ctSheet.addRow({ type: c.contact_type, role: c.role_title, name: c.name, email: c.email, phone: c.phone }));

  // --- Marketplace Apps Sheet ---
  const maSheet = workbook.addWorksheet("Marketplace Apps");
  maSheet.columns = [
    { header: "Product", key: "product", width: 30 }, { header: "Partner", key: "partner", width: 25 },
    { header: "Category", key: "category", width: 20 }, { header: "Stage", key: "stage", width: 25 },
    { header: "Notes", key: "notes", width: 30 },
  ];
  maSheet.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  (marketplace as Record<string, unknown>[]).forEach(a => maSheet.addRow({ product: a.product_name, partner: a.partner_account, category: a.partner_category, stage: a.stage, notes: a.notes }));

  // --- UPAs Sheet ---
  const upaSheet = workbook.addWorksheet("User Provided Apps");
  upaSheet.columns = [
    { header: "Name", key: "name", width: 25 }, { header: "Website URL", key: "url", width: 35 },
    { header: "Use Case", key: "use_case", width: 40 }, { header: "Deeplink", key: "deeplink", width: 10 },
  ];
  upaSheet.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  (upas as Record<string, unknown>[]).forEach(u => upaSheet.addRow({ name: u.name, url: u.website_url, use_case: u.use_case, deeplink: u.has_deeplink ? "Yes" : "No" }));

  // --- Solution Mix Sheet ---
  const smSheet = workbook.addWorksheet("Solution Mix");
  smSheet.columns = [
    { header: "Feature", key: "feature", width: 30 }, { header: "Needed", key: "needed", width: 10 },
    { header: "Licenses", key: "licenses", width: 12 }, { header: "Quote", key: "quote", width: 10 },
    { header: "Pilot", key: "pilot", width: 10 }, { header: "Production", key: "prod", width: 12 },
    { header: "Notes", key: "notes", width: 35 },
  ];
  smSheet.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  (features as Record<string, unknown>[]).forEach(f => smSheet.addRow({
    feature: f.feature_name, needed: f.needed ? "Yes" : "No", licenses: f.num_licenses ?? "",
    quote: f.required_for_quote ? "Yes" : "", pilot: f.required_for_pilot ? "Yes" : "",
    prod: f.required_for_production ? "Yes" : "", notes: f.notes,
  }));

  // --- Gaps Sheet ---
  const gapSheet = workbook.addWorksheet("Gaps");
  gapSheet.columns = [
    { header: "#", key: "num", width: 5 }, { header: "Gap Identified", key: "gap", width: 40 },
    { header: "Use Case", key: "use_case", width: 40 }, { header: "BD Engaged", key: "bd", width: 12 },
    { header: "Product Engaged", key: "product", width: 15 }, { header: "Blocker", key: "blocker", width: 10 },
    { header: "PSOP Ticket", key: "ticket", width: 15 },
  ];
  gapSheet.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  (gaps as Record<string, unknown>[]).forEach(g => gapSheet.addRow({
    num: g.gap_number, gap: g.gap_identified, use_case: g.use_case,
    bd: g.bd_team_engaged ? "Yes" : "No", product: g.product_team_engaged ? "Yes" : "No",
    blocker: g.customer_blocker ? "Yes" : "No", ticket: g.psop_ticket,
  }));

  // --- Workshop Sheet ---
  const wsSheet = workbook.addWorksheet("Workshop");
  wsSheet.columns = [
    { header: "Category", key: "category", width: 25 }, { header: "Question", key: "question", width: 60 },
    { header: "Response", key: "response", width: 50 }, { header: "Comments", key: "comments", width: 30 },
  ];
  wsSheet.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  (workshop as Record<string, unknown>[]).forEach(q => wsSheet.addRow({ category: q.sub_category, question: q.question, response: q.response, comments: q.comments }));

  // --- Training Sheet ---
  const trSheet = workbook.addWorksheet("Training");
  trSheet.columns = [
    { header: "Category", key: "category", width: 25 }, { header: "Question", key: "question", width: 60 },
    { header: "Response", key: "response", width: 50 }, { header: "Comments", key: "comments", width: 30 },
  ];
  trSheet.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  (training as Record<string, unknown>[]).forEach(q => trSheet.addRow({ category: q.sub_category, question: q.question, response: q.response, comments: q.comments }));

  // --- Forms Sheet ---
  const fmSheet = workbook.addWorksheet("Forms");
  fmSheet.columns = [
    { header: "#", key: "num", width: 5 }, { header: "Form Name", key: "name", width: 30 },
    { header: "Category", key: "category", width: 15 }, { header: "Type", key: "type", width: 10 },
    { header: "Purpose", key: "purpose", width: 40 }, { header: "Workflow", key: "workflow", width: 10 },
    { header: "# Fields", key: "fields", width: 10 },
  ];
  fmSheet.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  (forms as Record<string, unknown>[]).forEach(f => {
    let fieldCount = 0;
    try { fieldCount = JSON.parse((f.form_fields as string) || "[]").length; } catch {}
    fmSheet.addRow({ num: f.form_number, name: f.form_name, category: f.form_category, type: f.form_type, purpose: f.purpose, workflow: f.used_in_workflow ? "Yes" : "No", fields: fieldCount });
  });

  // --- Install Forecasts Sheet ---
  const ifSheet = workbook.addWorksheet("Install Strategy");
  ifSheet.columns = [
    { header: "Year", key: "year", width: 8 }, { header: "Month", key: "month", width: 8 },
    { header: "Forecasted", key: "forecasted", width: 12 }, { header: "Actual", key: "actual", width: 12 },
  ];
  ifSheet.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  (forecasts as Record<string, unknown>[]).forEach(f => ifSheet.addRow({ year: f.year, month: f.month, forecasted: f.forecasted, actual: f.actual }));

  // --- Workflow Technical Sheet ---
  if (wfTech) {
    const wtSheet = workbook.addWorksheet("Workflow Technical");
    wtSheet.columns = [{ header: "Field", key: "field", width: 30 }, { header: "Value", key: "value", width: 50 }];
    wtSheet.getRow(1).eachCell(c => Object.assign(c, headerStyle));
    const wt = wfTech as Record<string, unknown>;
    const wtFields = [
      ["PSE Hostname (Prod)", wt.pse_hostname_prod], ["PSE Hostname (Dev)", wt.pse_hostname_dev],
      ["PSE DB Name (Prod)", wt.pse_db_name_prod], ["PSE DB Name (Dev)", wt.pse_db_name_dev],
      ["PSE Access Level (Prod)", wt.pse_access_level_prod], ["TMS Name", wt.pse_tms_name],
      ["TMS Access Level", wt.tms_access_level], ["TMS IP", wt.tms_ip_address],
      ["PS+ CID Prod", wt.psplus_cid_prod], ["PS+ CID Test", wt.psplus_cid_test],
      ["PS+ CID Dev", wt.psplus_cid_dev], ["PS+ Enterprise ID", wt.psplus_enterprise_id],
    ];
    wtFields.forEach(([f, v]) => wtSheet.addRow({ field: f, value: v ?? "" }));
  }

  // --- Stats Sheet ---
  const stSheet = workbook.addWorksheet("Stats");
  stSheet.columns = [{ header: "Metric", key: "metric", width: 25 }, { header: "Value", key: "value", width: 15 }];
  stSheet.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  const st = stats as Record<string, unknown>;
  [
    ["Marketplace Apps", st.marketplace_apps], ["User Provided Apps", st.upas],
    ["Forms", st.forms], ["Gaps", st.gaps], ["Features Needed", st.features_needed],
  ].forEach(([m, v]) => stSheet.addRow({ metric: m, value: v }));

  const buffer = await workbook.xlsx.writeBuffer();
  const safeName = fleetName.replace(/[^a-zA-Z0-9-_ ]/g, "").substring(0, 50);

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${safeName}_Scope.xlsx"`,
    },
  });
}
