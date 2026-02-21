# Changelog

## [1.3.0] - 2026-02-21

### Added
- **Delete permissions** — Tiered delete rules: Draft (anyone), Active (no one), Complete (admin only)
- **Mark Complete / Reopen** — Manual status toggle buttons on scope detail sidebar
- **Help guide** — HelpCircle icon on dashboard opens full-screen feature guide modal (8 sections, admin section conditional)
- **Admin: Clear activity logs** — Date range picker to purge activity history with confirmation dialog
- **Admin: Activity pagination** — Paginated activity table (50 per page) with navigation
- **PRD document** — Comprehensive Product Requirements Document (`PRD.md`)
- **Standards document** — Reusable app development standards (`STANDARDS.md`)
- **nginx reverse proxy** — Serves static files on port 3000, proxies to Next.js on 3001 (fixes route group parentheses issue)

### Fixed
- **toggleComplete bug** — Status was sent at top level instead of inside `data` object, so "Mark Complete" never actually saved to DB
- **Bulk delete button** — Was always visible; now hidden unless all selected scopes are deletable by current user
- **Stale build deploys** — Old node processes serving cached build IDs; established clean deploy process with full kill + restart

---

## [1.2.0] - 2026-02-20

### Added
- **16 platform enhancements** (implemented via parallel agents):
  1. Dashboard search & filter (status, temperature, owner, date range)
  2. Bulk actions (select, change status, export, delete)
  3. Dashboard analytics panel (status distribution, avg completion, top owners)
  4. Duplicate scope detection on creation
  5. Keyboard shortcuts (Esc, Ctrl+S, 1-9, ?)
  6. Drag-and-drop row reordering (contacts, forms)
  7. Comments with @mentions
  8. Real-time presence indicators (who's viewing)
  9. Notification bell with unread count
  10. Notification preferences (per-type toggle)
  11. Change history viewer (field-level audit)
  12. Scope comparison (side-by-side, select 2)
  13. Branded PDF export (/print endpoint)
  14. Role-based permissions (owner/editor/viewer)
  15. Required field highlighting (amber border + asterisk)
  16. Field validation (email, phone, URL)
- **Nightly PostgreSQL backups** — pg_dump via cron at 2 AM UTC, 7-day retention

### Fixed
- **Scope visibility** — Changed from collaborator-only to all-users-see-all-scopes (LEFT JOIN with COALESCE default editor)
- **Auto-status logic** — 100% now sets "active" (not "complete"); "complete" is manual only
- **Set iteration TypeScript error** — Wrapped with `Array.from()` for compare page and comments route
- **Compare page prerender** — Added Suspense wrapper for useSearchParams

---

## [1.1.0] - 2026-02-20

### Added
- **Sticky progress bar** — Completion bar stays pinned at top when scrolling scope detail
  - Fixed layout: `fixed inset-0` outer div, flex column with overflow-y-auto content area
- **completion_config** — Inserted all 11 tab configurations into PostgreSQL (was empty after migration)

### Fixed
- **Stale JS chunks** — Clean deploy process: `rm -rf .next` before extracting tarball prevents browser loading cached old chunks

---

## [1.0.0] - 2026-02-20

### Added
- **PostgreSQL migration** — Dual-mode database adapter (SQLite for dev, PostgreSQL for production)
  - `DATABASE_MODE` env var switches between sqlite/postgres
  - `PgDatabase` class wraps `pg` pool to match sql.js API (`exec`/`run`)
  - `saveDb()` is no-op in Postgres mode
  - Placeholder conversion (`?` → `$1, $2, ...`)
- **Data migration script** — `scripts/migrate-sqlite-to-postgres.js` copies all 29 tables
- **PostgreSQL schema** — `scripts/postgres-schema.sql` with Postgres-compatible types
- **EC2 setup script** — `scripts/setup-postgres.sh` installs PostgreSQL 16, creates database and user

### Fixed
- **INSERT OR REPLACE** — Converted to `INSERT ... ON CONFLICT DO UPDATE` (3 locations in scopes.ts)
- **COLLATE NOCASE** — Replaced with `LOWER()` wrapping
- **Admin promotion persistence** — PostgreSQL eliminates the in-memory DB overwrite issue

---

## [0.x] - Pre-migration

### Core Platform
- Next.js 14.2 with App Router
- SQLite via sql.js (in-memory with file persistence)
- Name-only authentication via NextAuth JWT
- 12+ scope sections: Overview, Contacts, Marketplace Apps, UPAs, Solution Features, Gaps, Forms, Install Forecasts, Workflow Integration, Workflow Technical, Workshop Questions, Training Questions
- Salesforce OAuth integration (search accounts, import data)
- Scope cloning, sharing via token links
- Template system (save/create from templates)
- CSV/JSON export
- 4-theme system (Light, Dim, Dark, Midnight)
- Admin panel: user management, completion config
- Audit trail and activity logging
- Standalone deployment to EC2
