import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const doc = searchParams.get("doc") || "prd";

  const docs: Record<string, { title: string; content: string }> = {
    prd: { title: "Solution Scoping Platform — Product Requirements Document", content: getPRD() },
    standards: { title: "Application Development Standards", content: getStandards() },
    changelog: { title: "Changelog", content: getChangelog() },
  };

  const selected = docs[doc];
  if (!selected) return NextResponse.json({ error: "Unknown doc" }, { status: 404 });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${selected.title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  :root { --blue: #3b82f6; --blue-light: #dbeafe; --amber: #f59e0b; --emerald: #10b981; --gray-50: #f9fafb; --gray-100: #f3f4f6; --gray-200: #e5e7eb; --gray-300: #d1d5db; --gray-500: #6b7280; --gray-600: #4b5563; --gray-700: #374151; --gray-800: #1f2937; --gray-900: #111827; }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body { font-family: 'Inter', -apple-system, system-ui, sans-serif; color: var(--gray-800); line-height: 1.7; background: #fff; }

  .container { max-width: 900px; margin: 0 auto; padding: 40px 48px; }

  /* Print styles */
  @media print {
    body { font-size: 11px; line-height: 1.5; }
    .container { padding: 20px; max-width: 100%; }
    .no-print { display: none !important; }
    h1 { font-size: 22px; }
    h2 { font-size: 16px; page-break-after: avoid; }
    h3 { font-size: 13px; page-break-after: avoid; }
    table { page-break-inside: avoid; }
    .section { page-break-inside: avoid; }
    pre { font-size: 9px; }
  }

  /* Header */
  .doc-header { border-bottom: 3px solid var(--blue); padding-bottom: 24px; margin-bottom: 40px; }
  .doc-header h1 { font-size: 28px; font-weight: 700; color: var(--gray-900); margin-bottom: 8px; }
  .doc-header .meta { display: flex; gap: 24px; flex-wrap: wrap; color: var(--gray-500); font-size: 13px; }
  .doc-header .meta span { display: flex; align-items: center; gap: 6px; }

  /* Nav bar */
  .nav-bar { position: sticky; top: 0; background: #fff; border-bottom: 1px solid var(--gray-200); padding: 12px 0; margin-bottom: 32px; z-index: 10; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .nav-bar a { display: inline-flex; align-items: center; gap: 6px; padding: 6px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; text-decoration: none; color: var(--gray-600); border: 1px solid var(--gray-200); transition: all 0.15s; }
  .nav-bar a:hover { background: var(--blue-light); color: var(--blue); border-color: var(--blue); }
  .nav-bar a.active { background: var(--blue); color: #fff; border-color: var(--blue); }
  .nav-bar .print-btn { margin-left: auto; background: var(--gray-900); color: #fff; border-color: var(--gray-900); cursor: pointer; }
  .nav-bar .print-btn:hover { background: var(--gray-700); }

  /* Headings */
  h2 { font-size: 20px; font-weight: 700; color: var(--gray-900); margin-top: 48px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid var(--gray-100); }
  h3 { font-size: 15px; font-weight: 600; color: var(--gray-800); margin-top: 28px; margin-bottom: 12px; }
  h4 { font-size: 13px; font-weight: 600; color: var(--blue); margin-top: 16px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }

  /* Text */
  p { margin-bottom: 12px; color: var(--gray-600); font-size: 14px; }

  /* Lists */
  ul, ol { margin-bottom: 12px; padding-left: 24px; }
  li { margin-bottom: 6px; color: var(--gray-600); font-size: 14px; }
  li strong { color: var(--gray-800); }

  /* Tables */
  table { width: 100%; border-collapse: collapse; margin: 16px 0 24px; font-size: 13px; }
  thead th { background: var(--gray-50); color: var(--gray-600); font-weight: 600; text-align: left; padding: 10px 14px; border: 1px solid var(--gray-200); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  tbody td { padding: 10px 14px; border: 1px solid var(--gray-200); color: var(--gray-700); vertical-align: top; }
  tbody tr:hover { background: var(--gray-50); }

  /* Code */
  code { font-family: 'JetBrains Mono', monospace; font-size: 12px; background: var(--gray-100); padding: 2px 6px; border-radius: 4px; color: var(--gray-700); }
  pre { background: var(--gray-900); color: #e5e7eb; padding: 16px 20px; border-radius: 8px; overflow-x: auto; margin: 12px 0 20px; font-size: 12px; line-height: 1.6; }
  pre code { background: transparent; padding: 0; color: inherit; }

  /* Callout boxes */
  .callout { background: var(--blue-light); border-left: 4px solid var(--blue); padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; font-size: 13px; color: var(--gray-700); }

  /* Status badges */
  .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge-amber { background: #fef3c7; color: #92400e; }
  .badge-blue { background: #dbeafe; color: #1e40af; }
  .badge-green { background: #d1fae5; color: #065f46; }
  .badge-gray { background: #f3f4f6; color: #374151; }

  /* Flow diagram */
  .flow { display: flex; align-items: center; gap: 12px; margin: 16px 0; flex-wrap: wrap; }
  .flow .step { padding: 6px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; }
  .flow .arrow { color: var(--gray-400); font-size: 18px; }

  /* Section divider */
  hr { border: none; border-top: 1px solid var(--gray-200); margin: 40px 0; }

  /* Checklist */
  .checklist { list-style: none; padding-left: 0; }
  .checklist li { padding: 6px 0 6px 28px; position: relative; }
  .checklist li::before { content: "☐"; position: absolute; left: 0; color: var(--gray-400); font-size: 16px; }

  /* Two column grid */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
  @media (max-width: 640px) { .grid-2 { grid-template-columns: 1fr; } }
  .grid-2 .card { background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: 8px; padding: 16px; }
  .grid-2 .card h4 { margin-top: 0; }

  /* Footer */
  .doc-footer { margin-top: 60px; padding-top: 20px; border-top: 2px solid var(--gray-100); color: var(--gray-400); font-size: 12px; text-align: center; }
</style>
</head>
<body>
<div class="container">
  <div class="nav-bar no-print">
    <a href="/api/docs?doc=prd" class="${doc === "prd" ? "active" : ""}">PRD</a>
    <a href="/api/docs?doc=standards" class="${doc === "standards" ? "active" : ""}">Standards</a>
    <a href="/api/docs?doc=changelog" class="${doc === "changelog" ? "active" : ""}">Changelog</a>
    <a class="print-btn" onclick="window.print()">Print / Save PDF</a>
  </div>
  ${selected.content}
  <div class="doc-footer">
    Solution Scoping Platform &middot; Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
  </div>
</div>
</body>
</html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}


function getPRD(): string {
  return `
<div class="doc-header">
  <h1>Solution Scoping Platform</h1>
  <p style="font-size:16px; color: var(--gray-500); margin-bottom: 12px;">Product Requirements Document</p>
  <div class="meta">
    <span>Version 1.0</span>
    <span>February 2026</span>
    <span>Status: Baseline Standard</span>
  </div>
</div>

<h2>1. Executive Summary</h2>
<p>The Solution Scoping Platform is a web-based document management system designed for solution engineering teams to create, manage, and collaborate on customer solution scoping documents. It provides structured data capture across 12+ scope sections, real-time collaboration, Salesforce integration, completion tracking, and role-based access control.</p>

<h2>2. CRUD Operations</h2>
<h3>2.1 Scope Documents</h3>
<table>
  <thead><tr><th>Operation</th><th>Behavior</th></tr></thead>
  <tbody>
    <tr><td><strong>Create</strong></td><td>New scope via manual entry or Salesforce import. Duplicate detection warns if similar name exists.</td></tr>
    <tr><td><strong>Read</strong></td><td>Dashboard lists all scopes with status, owner, completion %. Detail view shows all 12+ sections.</td></tr>
    <tr><td><strong>Update</strong></td><td>Auto-save on field change (debounced 500-1000ms). Toast notification confirms save.</td></tr>
    <tr><td><strong>Delete</strong></td><td>Permission-based: Draft (anyone), Active (no one), Complete (admin only). Cascade deletes all related data.</td></tr>
  </tbody>
</table>

<h3>2.2 Scope Sections</h3>
<table>
  <thead><tr><th>Section</th><th>Key Fields</th><th>Special Behaviors</th></tr></thead>
  <tbody>
    <tr><td><strong>Fleet Overview</strong></td><td>50+ fields: location, website, TMS, TSP, personnel, hardware</td><td>Auto-created with scope. City autocomplete.</td></tr>
    <tr><td><strong>Contacts</strong></td><td>Name, title, email, phone, role</td><td>Bulk import from CSV/Salesforce. Validation.</td></tr>
    <tr><td><strong>Marketplace Apps</strong></td><td>Product, partner, solution type, category, stage</td><td>Searchable catalog of 100+ products.</td></tr>
    <tr><td><strong>User Provided Apps</strong></td><td>Name, use case, APK type, deeplink</td><td>Customer's existing tech stack.</td></tr>
    <tr><td><strong>Solution Features</strong></td><td>Feature name, needed, licenses, stages</td><td>Auto-seeded with 100+ predefined features.</td></tr>
    <tr><td><strong>Gaps</strong></td><td>Gap #, use case, BD engagement, blocker</td><td>Solution-to-requirement mismatches.</td></tr>
    <tr><td><strong>Forms</strong></td><td>Form #, name, purpose, category, workflow</td><td>Required paperwork tracking.</td></tr>
    <tr><td><strong>Install Forecasts</strong></td><td>Year, month, forecasted, actual</td><td>Pre-seeded monthly for 2025-2026.</td></tr>
    <tr><td><strong>Workflow Integration</strong></td><td>JSON business process mapping</td><td>Visual workflow builder.</td></tr>
    <tr><td><strong>Workflow Technical</strong></td><td>PSE config, TMS, PS+ integration</td><td>Sensitive fields encrypted (AES-256).</td></tr>
    <tr><td><strong>Workshop Questions</strong></td><td>Sub-category, question, response</td><td>Discovery workshop prep.</td></tr>
    <tr><td><strong>Training Questions</strong></td><td>Type, personnel, question, response</td><td>Training needs documentation.</td></tr>
  </tbody>
</table>

<h3>2.3 Supporting Entities</h3>
<table>
  <thead><tr><th>Entity</th><th>Operations</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td><strong>Comments</strong></td><td>Create, Read, Delete</td><td>Per-section with @mentions</td></tr>
    <tr><td><strong>Collaborators</strong></td><td>Add, List, Update Role, Remove</td><td>Owner/Editor/Viewer roles</td></tr>
    <tr><td><strong>Notifications</strong></td><td>Auto-create, Read, Mark Read</td><td>In-app bell with unread count</td></tr>
    <tr><td><strong>Templates</strong></td><td>Create from Scope, List, Use, Delete</td><td>Snapshot as reusable template</td></tr>
    <tr><td><strong>Users</strong></td><td>Auto-create, Read, Update, Delete</td><td>Name-based auth, no passwords</td></tr>
  </tbody>
</table>

<h2>3. Change Management</h2>

<h3>3.1 Audit Trail</h3>
<ul>
  <li><strong>Granularity:</strong> Per-section before/after snapshots on every update</li>
  <li><strong>Coverage:</strong> All 11 trackable scope sections</li>
  <li><strong>Storage:</strong> <code>audit_log</code> table with <code>before_json</code> and <code>after_json</code></li>
</ul>

<h3>3.2 Activity Logging</h3>
<ul>
  <li><strong>20+ action types:</strong> login, create_scope, update_*, delete_scope, clone_scope, sharing, collaborators</li>
  <li><strong>Metadata:</strong> User ID, IP address, city/region/country (geolocation), user agent, timestamp</li>
  <li><strong>Admin tools:</strong> View, filter, and clear logs by date range</li>
</ul>

<h3>3.3 Status Governance</h3>
<div class="flow">
  <span class="step badge-amber">Draft</span>
  <span class="arrow">&rarr;</span>
  <span style="font-size:11px; color: var(--gray-500)">auto at 100%</span>
  <span class="arrow">&rarr;</span>
  <span class="step badge-blue">Active</span>
  <span class="arrow">&rarr;</span>
  <span style="font-size:11px; color: var(--gray-500)">manual</span>
  <span class="arrow">&rarr;</span>
  <span class="step badge-green">Complete</span>
</div>
<table>
  <thead><tr><th>Rule</th><th>Detail</th></tr></thead>
  <tbody>
    <tr><td>Draft &rarr; Active</td><td>Automatic when completion reaches 100%</td></tr>
    <tr><td>Active &rarr; Complete</td><td>Manual button click only</td></tr>
    <tr><td>Delete Draft</td><td>Any user</td></tr>
    <tr><td>Delete Active</td><td>No one</td></tr>
    <tr><td>Delete Complete</td><td>Admin only</td></tr>
  </tbody>
</table>

<h2>4. Authentication & Authorization</h2>
<table>
  <thead><tr><th>Role</th><th>View</th><th>Edit</th><th>Delete</th><th>Share</th><th>Admin</th></tr></thead>
  <tbody>
    <tr><td><strong>Viewer</strong></td><td>Yes</td><td>No</td><td>No</td><td>No</td><td>No</td></tr>
    <tr><td><strong>Editor</strong></td><td>Yes</td><td>Yes</td><td>Draft</td><td>No</td><td>No</td></tr>
    <tr><td><strong>Owner</strong></td><td>Yes</td><td>Yes</td><td>Draft</td><td>Yes</td><td>No</td></tr>
    <tr><td><strong>Admin</strong></td><td>Yes</td><td>Yes</td><td>Draft + Complete</td><td>Yes</td><td>Yes</td></tr>
  </tbody>
</table>

<h2>5. Collaboration</h2>
<div class="grid-2">
  <div class="card"><h4>Sharing</h4><p>Generate tokenized share links with viewer access. Revoke anytime.</p></div>
  <div class="card"><h4>Comments & @Mentions</h4><p>Per-section comments. @username triggers notification.</p></div>
  <div class="card"><h4>Presence</h4><p>Real-time indicators showing who is currently viewing a scope.</p></div>
  <div class="card"><h4>Notifications</h4><p>Bell icon with unread count. Types: updates, status changes, comments, collaborator added. Configurable per-type.</p></div>
</div>

<h2>6. Dashboard</h2>
<div class="grid-2">
  <div class="card"><h4>Search & Filter</h4><p>Full-text search by name/owner. Filter by status, temperature, owner, date range. Active filter pills.</p></div>
  <div class="card"><h4>Bulk Actions</h4><p>Multi-select via checkboxes. Change status, export CSV, delete (respects permissions).</p></div>
  <div class="card"><h4>Analytics</h4><p>Status distribution, average completion %, top owners, recent activity feed.</p></div>
  <div class="card"><h4>Comparison</h4><p>Select exactly 2 scopes for side-by-side diff across all sections.</p></div>
</div>

<h2>7. Completion Tracking</h2>
<ul>
  <li><strong>Admin configures</strong> required fields per tab (11 tabs)</li>
  <li><strong>Progress bar</strong> shows % filled across all configured tabs</li>
  <li><strong>Colors:</strong> Green (&ge;75%), Blue (40-75%), Amber (&lt;40%)</li>
  <li><strong>Auto-status:</strong> Draft &rarr; Active at 100%. Complete is manual only.</li>
  <li><strong>Required fields</strong> highlighted with amber border + asterisk</li>
</ul>

<h2>8. Export & Import</h2>
<table>
  <thead><tr><th>Format</th><th>Scope</th><th>Details</th></tr></thead>
  <tbody>
    <tr><td><strong>PDF</strong></td><td>Single scope</td><td>Print-friendly HTML via <code>/print</code> endpoint</td></tr>
    <tr><td><strong>CSV</strong></td><td>Single or bulk</td><td>Column headers match field names</td></tr>
    <tr><td><strong>JSON</strong></td><td>Single or all</td><td>Full data export including all sections</td></tr>
    <tr><td><strong>Salesforce</strong></td><td>Import</td><td>OAuth search, auto-fill account + contacts</td></tr>
    <tr><td><strong>Templates</strong></td><td>Save/Load</td><td>Snapshot scope as reusable starting point</td></tr>
    <tr><td><strong>Clone</strong></td><td>Full copy</td><td>Duplicate with &ldquo;(Copy)&rdquo; suffix, new owner</td></tr>
  </tbody>
</table>

<h2>9. UI/UX Standards</h2>
<h3>Theme System</h3>
<div class="flow">
  <span class="step" style="background:#fff; border:1px solid #e5e7eb; color:#111;">Light</span>
  <span class="step" style="background:#1a1a2e; color:#e0e0e0;">Dim</span>
  <span class="step" style="background:#0a0a0a; color:#fafafa;">Dark</span>
  <span class="step" style="background:#000; color:#fff;">Midnight</span>
</div>

<h3>Interaction Patterns</h3>
<table>
  <thead><tr><th>Pattern</th><th>Standard</th></tr></thead>
  <tbody>
    <tr><td>Auto-save</td><td>Debounced 500ms on field change, toast confirmation</td></tr>
    <tr><td>Toasts</td><td>Success (green), Error (red), Info (blue). Auto-dismiss 4s. Bottom-right stack.</td></tr>
    <tr><td>Confirmations</td><td>Required for all destructive actions (delete, revoke, clear)</td></tr>
    <tr><td>Keyboard shortcuts</td><td>Esc (back), Ctrl+S (save), 1-9 (tabs), ? (help)</td></tr>
    <tr><td>Drag & drop</td><td>Row reordering with visual feedback, persisted sort order</td></tr>
    <tr><td>Validation</td><td>Email, phone (auto-format), URL — amber border on invalid</td></tr>
  </tbody>
</table>

<h2>10. Admin Features</h2>
<ul>
  <li><strong>User management:</strong> View, promote/demote admin, delete, edit name, transfer ownership</li>
  <li><strong>Completion config:</strong> Required fields per tab, min row counts</li>
  <li><strong>Activity logs:</strong> View with pagination, clear by date range</li>
  <li><strong>Database backups:</strong> Nightly pg_dump, 7-day retention</li>
</ul>

<h2>11. Technical Architecture</h2>
<table>
  <thead><tr><th>Component</th><th>Technology</th></tr></thead>
  <tbody>
    <tr><td>Frontend</td><td>Next.js 14.2 (React, App Router)</td></tr>
    <tr><td>Styling</td><td>Tailwind CSS + CSS custom properties</td></tr>
    <tr><td>Auth</td><td>NextAuth.js, JWT (24h sessions)</td></tr>
    <tr><td>Database</td><td>PostgreSQL 16 (prod), SQLite (dev)</td></tr>
    <tr><td>Deployment</td><td>Standalone Next.js on EC2, nginx proxy</td></tr>
    <tr><td>Icons</td><td>Lucide React</td></tr>
  </tbody>
</table>
`;
}


function getStandards(): string {
  return `
<div class="doc-header">
  <h1>Application Development Standards</h1>
  <p style="font-size:16px; color: var(--gray-500); margin-bottom: 12px;">Reusable Defaults for Next.js Projects</p>
  <div class="meta">
    <span>Extracted from: Solution Scoping Platform</span>
    <span>February 2026</span>
  </div>
</div>

<h2>1. CRUD Patterns</h2>

<h3>API Route Structure</h3>
<pre><code>src/app/api/
  [entity]/
    route.ts          &rarr; GET (list), POST (create)
    [id]/
      route.ts        &rarr; GET (detail), PATCH (update), DELETE (remove)</code></pre>

<h3>Standard API Responses</h3>
<pre><code>// Success
NextResponse.json({ ok: true });
NextResponse.json(data);
NextResponse.json({ id: newId });

// Errors
NextResponse.json({ error: "Unauthorized" }, { status: 401 });
NextResponse.json({ error: "Forbidden" }, { status: 403 });
NextResponse.json({ error: "Not found" }, { status: 404 });
NextResponse.json({ error: "Descriptive message" }, { status: 400 });</code></pre>

<h3>Auth Guard (every route)</h3>
<pre><code>const session = await auth();
if (!session?.user?.id)
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });</code></pre>

<h3>Delete Protection</h3>
<pre><code>if (entity.status === "active")
  return error("Active items cannot be deleted.", 400);
if (entity.status === "complete" && !isAdmin)
  return error("Only admins can delete completed items.", 403);</code></pre>

<h2>2. Display Standards</h2>

<h3>Theme System (4 Themes)</h3>
<table>
  <thead><tr><th>Theme</th><th>Background</th><th>Use Case</th></tr></thead>
  <tbody>
    <tr><td><strong>Light</strong></td><td>#ffffff</td><td>Daytime, bright environments</td></tr>
    <tr><td><strong>Dim</strong></td><td>#1a1a2e</td><td>Low-light, reduced eye strain</td></tr>
    <tr><td><strong>Dark</strong></td><td>#0a0a0a</td><td>Default, most users</td></tr>
    <tr><td><strong>Midnight</strong></td><td>#000000</td><td>OLED screens, maximum contrast</td></tr>
  </tbody>
</table>
<p>Implementation: <code>next-themes</code> with CSS custom properties (<code>--bg</code>, <code>--bg-secondary</code>, <code>--bg-card</code>, <code>--border</code>, <code>--text</code>, <code>--text-secondary</code>, <code>--text-muted</code>).</p>

<h3>Color Conventions</h3>
<table>
  <thead><tr><th>Element</th><th>Color</th></tr></thead>
  <tbody>
    <tr><td>Primary actions</td><td><code>blue-600</code> / <code>blue-500</code> hover</td></tr>
    <tr><td>Destructive</td><td><code>red-400</code> text, <code>red-500/5</code> bg</td></tr>
    <tr><td>Success</td><td><code>emerald-400</code></td></tr>
    <tr><td>Warning</td><td><code>amber-400</code></td></tr>
    <tr><td>Info</td><td><code>blue-400</code></td></tr>
  </tbody>
</table>

<h3>Component Patterns</h3>
<div class="grid-2">
  <div class="card"><h4>Cards</h4><p><code>bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6</code></p></div>
  <div class="card"><h4>Modals</h4><p>Fixed overlay with backdrop blur. Header/body/footer layout. Click-outside to dismiss.</p></div>
  <div class="card"><h4>Tables</h4><p>Full-width, hover rows, uppercase tracking-wider headers, border between rows.</p></div>
  <div class="card"><h4>Status Badges</h4><p>Rounded, 10px uppercase, color-coded per status. Semi-transparent backgrounds.</p></div>
</div>

<h2>3. UX Standards</h2>

<table>
  <thead><tr><th>Pattern</th><th>Implementation</th></tr></thead>
  <tbody>
    <tr><td><strong>Auto-save</strong></td><td>Debounced onChange (500ms). Toast confirms. No save button needed.</td></tr>
    <tr><td><strong>Toast notifications</strong></td><td>3 types: success/error/info. Auto-dismiss 4s. Bottom-right stack.</td></tr>
    <tr><td><strong>Confirm dialogs</strong></td><td>Required before all deletes, revocations, and bulk destructive actions.</td></tr>
    <tr><td><strong>Keyboard shortcuts</strong></td><td>Esc (back), Ctrl+S (save), 1-9 (tabs), ? (show shortcuts).</td></tr>
    <tr><td><strong>Drag & drop</strong></td><td>Row reordering via HTML5 drag. Visual: opacity change + blue border.</td></tr>
    <tr><td><strong>Validation</strong></td><td>Email, phone (auto-format), URL. Amber border on invalid.</td></tr>
    <tr><td><strong>Required fields</strong></td><td>Amber asterisk + amber border when empty. Admin-configurable.</td></tr>
    <tr><td><strong>Loading states</strong></td><td>Spinner (border-2 animate-spin). Skeleton (animate-pulse gray bars).</td></tr>
    <tr><td><strong>Empty states</strong></td><td>Icon + heading + description + CTA button. Centered.</td></tr>
    <tr><td><strong>Search &amp; filter</strong></td><td>Real-time text search. Multi-facet filters. Active filter pills.</td></tr>
  </tbody>
</table>

<h2>4. Architecture Standards</h2>

<h3>File Organization</h3>
<pre><code>src/
  app/
    (auth)/           &rarr; Login, register (no sidebar)
    (dashboard)/      &rarr; Main app pages (with header)
    (admin)/          &rarr; Admin-only pages
    api/              &rarr; API routes
  lib/
    auth.ts           &rarr; NextAuth config
    db.ts             &rarr; Database connection + schema
    [entity].ts       &rarr; Data access layer (all SQL)
    utils.ts          &rarr; Helpers (ID gen, formatting)
  components/         &rarr; Reusable UI components
  hooks/              &rarr; Custom React hooks</code></pre>

<h3>Key Principles</h3>
<ul>
  <li><strong>SQL only in lib/</strong> &mdash; API routes call functions, never write SQL directly</li>
  <li><strong>Audit everything</strong> &mdash; Before/after snapshots on mutations, activity log on actions</li>
  <li><strong>Fire-and-forget logging</strong> &mdash; <code>.then().catch(() =&gt; {})</code> so logging never blocks responses</li>
  <li><strong>Notifications respect preferences</strong> &mdash; <code>createNotificationIfEnabled()</code> checks user prefs</li>
</ul>

<h2>5. Deployment Standards</h2>

<h3>Stack</h3>
<table>
  <thead><tr><th>Layer</th><th>Technology</th></tr></thead>
  <tbody>
    <tr><td>Reverse proxy</td><td>nginx (serves static files, proxies API)</td></tr>
    <tr><td>Application</td><td>Next.js standalone (node server.js)</td></tr>
    <tr><td>Database</td><td>PostgreSQL (prod), SQLite (dev)</td></tr>
    <tr><td>Hosting</td><td>EC2 (or any Linux server)</td></tr>
  </tbody>
</table>

<h3>Required Environment Variables</h3>
<table>
  <thead><tr><th>Variable</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td><code>AUTH_SECRET</code></td><td>NextAuth JWT signing</td></tr>
    <tr><td><code>ENCRYPTION_KEY</code></td><td>AES-256 for sensitive fields</td></tr>
    <tr><td><code>NEXTAUTH_URL</code></td><td>App base URL</td></tr>
    <tr><td><code>DATABASE_MODE</code></td><td>sqlite or postgres</td></tr>
    <tr><td><code>DATABASE_URL</code></td><td>PostgreSQL connection string</td></tr>
  </tbody>
</table>

<h2>6. Icon Library (Lucide React)</h2>
<div class="grid-2">
  <div class="card"><h4>Actions</h4><p>Plus (add), Pencil (edit), Trash2 (delete), Copy (clone), Download (export)</p></div>
  <div class="card"><h4>Navigation</h4><p>Search, Filter, ArrowUpDown (sort), ChevronRight, ArrowLeft, X (close)</p></div>
  <div class="card"><h4>Status</h4><p>CheckCircle (success), AlertTriangle (warning), HelpCircle (help), Activity</p></div>
  <div class="card"><h4>UI</h4><p>Settings, Bell, LogOut, MoreVertical (menu), Layers, Clock, Calendar, BarChart3</p></div>
</div>

<h2>7. New Project Checklist</h2>
<ul class="checklist">
  <li>Next.js 14+ with App Router</li>
  <li>Tailwind CSS + CSS custom properties for theming</li>
  <li>4 theme presets (Light, Dim, Dark, Midnight)</li>
  <li>NextAuth with JWT sessions (24h expiry)</li>
  <li>Role-based access: Viewer, Editor, Owner, Admin</li>
  <li>Lucide React icons</li>
  <li>Toast notification system</li>
  <li>Confirmation dialogs for destructive actions</li>
  <li>Auto-save with debounce</li>
  <li>Keyboard shortcuts</li>
  <li>Search + filter + sort on list pages</li>
  <li>Bulk select + bulk actions</li>
  <li>Audit trail (before/after snapshots)</li>
  <li>Activity logging</li>
  <li>Required field highlighting</li>
  <li>Completion/progress tracking</li>
  <li>Export: CSV, JSON, PDF</li>
  <li>Help guide modal</li>
  <li>nginx reverse proxy</li>
  <li>PostgreSQL for production, SQLite for dev</li>
</ul>
`;
}


function getChangelog(): string {
  return `
<div class="doc-header">
  <h1>Changelog</h1>
  <p style="font-size:16px; color: var(--gray-500); margin-bottom: 12px;">Solution Scoping Platform</p>
  <div class="meta">
    <span>All notable changes to this project</span>
  </div>
</div>

<h2><span class="badge badge-green">1.3.0</span> &mdash; February 21, 2026</h2>
<h3>Added</h3>
<ul>
  <li><strong>Delete permissions</strong> &mdash; Tiered rules: Draft (anyone), Active (no one), Complete (admin only). Frontend hides buttons + backend enforces.</li>
  <li><strong>Mark Complete / Reopen</strong> &mdash; Manual status toggle buttons on scope detail sidebar.</li>
  <li><strong>Help guide</strong> &mdash; HelpCircle icon on dashboard opens full-screen feature guide modal (8 sections, admin-conditional).</li>
  <li><strong>Admin: Clear activity logs</strong> &mdash; Date range picker to purge activity history with confirmation dialog.</li>
  <li><strong>Admin: Activity pagination</strong> &mdash; 50 per page with navigation controls.</li>
  <li><strong>PRD document</strong> &mdash; Comprehensive Product Requirements Document.</li>
  <li><strong>Standards document</strong> &mdash; Reusable app development standards for future projects.</li>
  <li><strong>Shareable docs</strong> &mdash; <code>/api/docs</code> endpoint serves PRD, Standards, and Changelog as printable HTML.</li>
  <li><strong>nginx reverse proxy</strong> &mdash; Serves static files on :3000, proxies to Next.js on :3001.</li>
</ul>
<h3>Fixed</h3>
<ul>
  <li><strong>toggleComplete bug</strong> &mdash; Status was sent at top level instead of inside <code>data</code> object.</li>
  <li><strong>Bulk delete button</strong> &mdash; Now hidden unless all selected scopes are deletable by current user.</li>
  <li><strong>Stale build deploys</strong> &mdash; Established clean deploy process with full kill + restart.</li>
</ul>

<hr/>

<h2><span class="badge badge-blue">1.2.0</span> &mdash; February 20, 2026</h2>
<h3>Added (16 Platform Enhancements)</h3>
<ol>
  <li>Dashboard search &amp; filter (status, temperature, owner, date range)</li>
  <li>Bulk actions (select, change status, export, delete)</li>
  <li>Dashboard analytics panel (status distribution, avg completion, top owners)</li>
  <li>Duplicate scope detection on creation</li>
  <li>Keyboard shortcuts (Esc, Ctrl+S, 1-9, ?)</li>
  <li>Drag-and-drop row reordering</li>
  <li>Comments with @mentions</li>
  <li>Real-time presence indicators</li>
  <li>Notification bell with unread count</li>
  <li>Notification preferences (per-type toggle)</li>
  <li>Change history viewer (field-level audit)</li>
  <li>Scope comparison (side-by-side, select 2)</li>
  <li>Branded PDF export</li>
  <li>Role-based permissions (owner/editor/viewer)</li>
  <li>Required field highlighting</li>
  <li>Field validation (email, phone, URL)</li>
</ol>
<p>Plus: Nightly PostgreSQL backups via pg_dump (cron, 2 AM UTC, 7-day retention).</p>

<h3>Fixed</h3>
<ul>
  <li><strong>Scope visibility</strong> &mdash; Changed to all-users-see-all-scopes (LEFT JOIN with COALESCE default editor).</li>
  <li><strong>Auto-status logic</strong> &mdash; 100% now sets &ldquo;active&rdquo; not &ldquo;complete&rdquo;; complete is manual only.</li>
  <li><strong>TypeScript Set iteration</strong> &mdash; Wrapped with <code>Array.from()</code>.</li>
  <li><strong>Compare page prerender</strong> &mdash; Added Suspense wrapper for useSearchParams.</li>
</ul>

<hr/>

<h2><span class="badge badge-blue">1.1.0</span> &mdash; February 20, 2026</h2>
<h3>Added</h3>
<ul>
  <li><strong>Sticky progress bar</strong> &mdash; Completion bar stays pinned at top when scrolling scope detail. Fixed layout approach.</li>
  <li><strong>completion_config data</strong> &mdash; Inserted all 11 tab configurations into PostgreSQL.</li>
</ul>
<h3>Fixed</h3>
<ul>
  <li><strong>Stale JS chunks</strong> &mdash; Clean deploy process: <code>rm -rf .next</code> before extracting tarball.</li>
</ul>

<hr/>

<h2><span class="badge badge-amber">1.0.0</span> &mdash; February 20, 2026</h2>
<h3>Added</h3>
<ul>
  <li><strong>PostgreSQL migration</strong> &mdash; Dual-mode database adapter (SQLite dev / PostgreSQL prod).</li>
  <li><strong>Data migration script</strong> &mdash; Copies all 29 tables from SQLite to PostgreSQL.</li>
  <li><strong>Schema script</strong> &mdash; Postgres-compatible CREATE TABLE statements.</li>
  <li><strong>EC2 setup script</strong> &mdash; Installs PostgreSQL 16, creates database and user.</li>
</ul>
<h3>Fixed</h3>
<ul>
  <li><strong>INSERT OR REPLACE</strong> &mdash; Converted to <code>INSERT ... ON CONFLICT DO UPDATE</code>.</li>
  <li><strong>COLLATE NOCASE</strong> &mdash; Replaced with <code>LOWER()</code> wrapping.</li>
  <li><strong>Admin promotion</strong> &mdash; PostgreSQL eliminates the in-memory DB overwrite issue.</li>
</ul>

<hr/>

<h2><span class="badge badge-gray">0.x</span> &mdash; Pre-migration</h2>
<h3>Core Platform</h3>
<ul>
  <li>Next.js 14.2 with App Router</li>
  <li>SQLite via sql.js (in-memory + file persistence)</li>
  <li>Name-only authentication via NextAuth JWT</li>
  <li>12+ scope sections with full CRUD</li>
  <li>Salesforce OAuth integration</li>
  <li>Scope cloning, sharing via token links</li>
  <li>Template system</li>
  <li>CSV/JSON export</li>
  <li>4-theme system (Light, Dim, Dark, Midnight)</li>
  <li>Admin panel: user management, completion config</li>
  <li>Audit trail and activity logging</li>
  <li>Standalone deployment to EC2</li>
</ul>
`;
}
