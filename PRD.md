# Solution Scoping Platform - Product Requirements Document (PRD)

**Version:** 1.0
**Date:** February 21, 2026
**Status:** Baseline Standard

---

## 1. Executive Summary

The Solution Scoping Platform is a web-based document management system designed for solution engineering teams to create, manage, and collaborate on customer solution scoping documents. It provides structured data capture across 12+ scope sections, real-time collaboration, Salesforce integration, completion tracking, and role-based access control.

---

## 2. CRUD Operations

CRUD (Create, Read, Update, Delete) forms the foundation of all data interactions. Every entity in the system follows consistent patterns for data lifecycle management.

### 2.1 Scope Documents
| Operation | Behavior |
|-----------|----------|
| **Create** | New scope via manual entry or Salesforce import. Duplicate detection warns if similar name exists. |
| **Read** | Dashboard lists all scopes with status, owner, completion %. Detail view shows all 12+ sections. |
| **Update** | Auto-save on field change (debounced 500-1000ms). Toast notification confirms save. |
| **Delete** | Permission-based: Draft (anyone), Active (no one), Complete (admin only). Cascade deletes all related data. |

### 2.2 Scope Sections
Each scope contains the following data entities, all supporting full CRUD:

| Section | Key Fields | Special Behaviors |
|---------|-----------|-------------------|
| **Fleet Overview** | 50+ fields: location, website, TMS, TSP, personnel, hardware | Auto-created with scope. City autocomplete. |
| **Contacts** | Name, title, email, phone, role (PS Team / Fleet) | Bulk import from CSV/Salesforce. Email/phone validation. |
| **Marketplace Apps** | Product name, partner, solution type, category, stage | Searchable catalog of 100+ pre-loaded products. |
| **User Provided Apps** | Name, use case, APK type, deeplink support | Track customer's existing technology stack. |
| **Solution Features** | Feature name, needed, license count, required_for stages | Auto-seeded with 100+ predefined PS features. |
| **Gaps** | Gap #, identification, use case, BD engagement, blocker | Track solution-to-requirement mismatches. |
| **Forms** | Form #, name, purpose, category, workflow, decision tree | Track required paperwork and document status. |
| **Install Forecasts** | Year, month, forecasted count, actual count | Pre-seeded for 2025-2026. Monthly granularity. |
| **Workflow Integration** | JSON data structure for business process mapping | Visual workflow builder. |
| **Workflow Technical** | PSE config, TMS integration, PS+ integration, passwords | Sensitive fields encrypted (AES-256-CBC). |
| **Workshop Questions** | Sub-category, question, response, comments | Discovery workshop preparation. |
| **Training Questions** | Training type, personnel, sub-category, question, response | Training needs documentation. |

### 2.3 Supporting Entities

| Entity | Operations | Notes |
|--------|-----------|-------|
| **Comments** | Create, Read, Delete | Per-section comments with @mentions. |
| **Collaborators** | Add, List, Update Role, Remove | Owner/Editor/Viewer roles. |
| **Notifications** | Create (auto), Read, Mark Read | In-app bell with unread count. |
| **Templates** | Create from Scope, List, Use, Delete | Snapshot scope as reusable template. |
| **Users** | Auto-create on login, Read, Update, Delete (admin) | Name-based auth, no passwords. |

---

## 3. Change Management

Change management tracks all modifications to scope data, providing audit trails, activity logs, and status governance.

### 3.1 Audit Trail
- **Granularity:** Per-section before/after snapshots on every update
- **Storage:** `audit_log` table with `before_json` and `after_json` columns
- **Coverage:** All 11 trackable scope sections (overview, contacts, marketplace, features, gaps, forms, training, workshop, forecasts, workflow, workflow_technical)
- **Retrieval:** Audit history available per scope (most recent 50 entries)

### 3.2 Activity Logging
- **System-wide feed:** All user actions recorded in `access_log` table
- **20+ action types:** login, create_scope, update_*, delete_scope, clone_scope, enable_sharing, disable_sharing, add_collaborator, remove_collaborator
- **Metadata captured:** User ID, action type, IP address, city/region/country (via IP geolocation), user agent, timestamp
- **Admin access:** View, filter, and clear activity logs by date range

### 3.3 Status Governance
Scopes follow a controlled status progression:

```
Draft ──(auto at 100%)──> Active ──(manual)──> Complete
```

| Transition | Trigger | Reversible? |
|-----------|---------|-------------|
| Draft → Active | Automatic when completion reaches 100% | Yes (if completion drops below 100%) |
| Active → Complete | Manual button click by user | Yes (Reopen as Active) |
| Complete → Active | Manual button click by user | Yes |
| Any → Archived | Manual status change | Yes |

**Protection rules:**
- Auto-status never overrides a manually-set "Complete" status
- Active scopes cannot be deleted by anyone
- Complete scopes can only be deleted by admins

### 3.4 Field History
- Visual indicator (clock icon) on fields showing last modification timestamp
- Accessible via click on the history icon per field

---

## 4. Basic Functionality

### 4.1 Authentication
| Feature | Implementation |
|---------|---------------|
| **Login method** | Name-only authentication (no passwords) |
| **Session duration** | 24-hour JWT sessions via NextAuth |
| **Auto-registration** | New users created automatically on first login |
| **Admin login** | "admin" username requires ADMIN_PASSWORD environment variable |
| **Session storage** | Secure HTTP-only cookie with JWT token |

### 4.2 Authorization & Roles

| Role | Scope Access | Edit | Delete | Share | Admin Panel |
|------|-------------|------|--------|-------|-------------|
| **Viewer** | Read only | No | No | No | No |
| **Editor** | Full read | Yes | Draft only | No | No |
| **Owner** | Full read | Yes | Draft only | Yes | No |
| **Admin** | Full read | Yes | Draft + Complete | Yes | Yes |

**Default behavior:** All authenticated users see all scopes with Editor access unless a specific collaborator role is assigned.

### 4.3 Navigation
- **Dashboard:** Central hub listing all scopes with search, filter, sort, and bulk actions
- **Scope Detail:** Sidebar navigation with 12+ tabs for each data section
- **Admin Panel:** Settings gear icon (admin only) for user management, completion config, activity logs
- **Keyboard shortcuts:** Esc (back to dashboard), Ctrl+S (save), 1-9 (switch tabs), ? (show shortcuts)

### 4.4 Data Validation
| Validation | Behavior |
|-----------|----------|
| **Email** | Real-time format validation with error indicator |
| **Phone** | Auto-format to (XXX) XXX-XXXX, validate 7-15 digits |
| **URL** | Check http(s)://domain.ext format |
| **Required fields** | Amber border highlight, asterisk marker |
| **Number fields** | Min value constraints, integer enforcement |

### 4.5 Auto-Save
- All field changes are debounced (500-1000ms) and auto-persisted via API
- Toast notification confirms each save operation
- No explicit "Save" button required (Ctrl+S available as manual trigger)

---

## 5. Collaboration

### 5.1 Sharing
| Feature | Details |
|---------|---------|
| **Share links** | Generate tokenized URL for external access |
| **Access levels** | Viewer (read-only) via share link |
| **Revocation** | Disable sharing invalidates all existing share links |
| **Public endpoint** | `/share/[token]` provides read-only scope view |

### 5.2 Collaborator Management
- Add collaborators by searching user names
- Assign roles: Editor or Viewer
- Owner role cannot be changed (transfers available via admin)
- Remove collaborators at any time (except owner)

### 5.3 Comments & @Mentions
- Add comments to any scope section
- Use @username to notify specific team members
- Mentioned users receive in-app notifications
- Comment deletion available to comment author

### 5.4 Presence Indicators
- Real-time tracking of who is currently viewing a scope
- Avatar/name display in scope header
- Automatic cleanup when user navigates away

### 5.5 Notifications
| Type | Trigger |
|------|---------|
| **scope_update** | Collaborator edits a scope section |
| **status_change** | Scope status transitions |
| **comment** | New comment or @mention |
| **collaborator_added** | User added as collaborator |

**Notification preferences:** Each user can toggle on/off per notification type via the bell icon settings panel.

---

## 6. Dashboard Features

### 6.1 Search & Filter
| Filter | Options |
|--------|---------|
| **Text search** | Scope name, owner name (case-insensitive, real-time) |
| **Status** | All, Draft, Active, Complete, Archived |
| **Temperature** | All, Excellent, Good, Neutral, Poor |
| **Owner** | Dropdown of all scope owners |
| **Date range** | Created from/to date pickers |

Active filters shown as dismissible pills. "Clear All" resets all filters.

### 6.2 Sort Options
- **Name:** Alphabetical A-Z / Z-A
- **Updated:** Most recent / Oldest first
- **Status:** Alphabetical by status label

### 6.3 Bulk Actions
Select multiple scopes via checkboxes to enable:
- **Change Status:** Set all selected to Draft, Active, or Complete
- **Export:** Download selected scopes as CSV
- **Delete:** Remove all selected (respects permission rules)
- **Compare:** Side-by-side comparison (exactly 2 selected)

### 6.4 Analytics Panel
Toggle-able analytics section showing:
- Status distribution (count per status)
- Average completion percentage
- Top 5 scope owners by count
- Recent activity feed (last 5 actions)

### 6.5 Duplicate Detection
- On new scope creation, checks for existing scopes with similar names
- Warning dialog shows the matching scope name
- User can proceed ("Continue Anyway") or cancel

---

## 7. Completion Tracking

### 7.1 Configuration (Admin)
- Per-tab required field configuration
- **Fixed-field tabs:** Select which fields are mandatory (overview, workflow_technical)
- **Row-based tabs:** Set minimum row count + required fields per row (contacts, marketplace, gaps, etc.)
- Changes affect all scopes immediately

### 7.2 Progress Calculation
```
Tab Completion = (filled required fields / total required fields) x 100
Overall Completion = Average of all configured tab completions
```

### 7.3 Visual Indicators
| Indicator | Location | Colors |
|-----------|----------|--------|
| **Progress bar** | Dashboard card, scope header | Green (>=75%), Blue (40-75%), Amber (<40%) |
| **Required field highlight** | Scope detail fields | Amber border + asterisk |
| **Tab completion dots** | Sidebar tab list | Green/amber/red dots per tab |

### 7.4 Auto-Status Transitions
- **Below 100%:** Status = Draft (amber badge)
- **At 100%:** Status auto-advances to Active (blue badge)
- **Complete:** Manual action only via "Mark Complete" button (emerald badge)
- **Protection:** Manually-set "Complete" is never auto-downgraded

---

## 8. Export & Import

### 8.1 Export Formats
| Format | Scope | Access |
|--------|-------|--------|
| **PDF** | Single scope, all sections | Print-friendly HTML view via `/print` endpoint |
| **CSV** | Single or bulk scopes from dashboard | Column headers match field names |
| **JSON** | Single scope or all scopes | Full data export including all sections |

### 8.2 Import Sources
| Source | Data Imported |
|--------|--------------|
| **Salesforce** | Account name, HQ location, website, company type, AE, executive sponsor, contacts |
| **Manual entry** | All fields via inline editing |
| **Templates** | Pre-configured scope data from saved template |
| **Clone** | Full copy of existing scope with "(Copy)" suffix |

---

## 9. UI/UX Standards

### 9.1 Theme System
Four theme options persisted in browser localStorage:

| Theme | Description |
|-------|-------------|
| **Light** | Bright backgrounds, dark text. Daytime use. |
| **Dim** | Reduced brightness, softer contrast. Low-light use. |
| **Dark** | Dark backgrounds, light text. Default theme. |
| **Midnight** | Pure black backgrounds, maximum contrast. OLED-friendly. |

All themes use CSS custom properties: `--bg`, `--bg-secondary`, `--bg-card`, `--text`, `--text-secondary`, `--text-muted`, `--border`, `--accent`.

### 9.2 Toast Notifications
- **Success:** Green accent, auto-dismiss after 4 seconds
- **Error:** Red accent, auto-dismiss after 5 seconds
- **Info:** Blue accent, auto-dismiss after 4 seconds
- **Position:** Fixed bottom-right stack

### 9.3 Confirmation Dialogs
All destructive actions require explicit confirmation:
- Single scope deletion
- Bulk scope deletion
- Share link revocation
- Activity log clearing

### 9.4 Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Esc` | Return to dashboard |
| `Ctrl/Cmd + S` | Manual save |
| `1-9` | Switch between tabs (when not in input) |
| `?` | Toggle shortcut help |

### 9.5 Drag & Drop
- Reorder rows in contacts, forms, and other list-based tabs
- Visual feedback: opacity change during drag, blue highlight on drop target
- Sort order persisted to database

### 9.6 Responsive Design
- Dashboard grid adapts to screen width
- Scope detail sidebar collapses on smaller screens
- Help guide modal uses responsive two-column grid

---

## 10. Help System

### 10.1 Dashboard Help Icon
- HelpCircle icon in dashboard header bar
- Opens full-screen modal with comprehensive user guide
- 8 sections covering all platform features
- Admin section conditionally shown for admin users
- Styled with card-based layout, blue accent headings

### 10.2 Keyboard Shortcut Overlay
- Triggered by `?` key in scope detail view
- Shows all 4 keyboard shortcuts with descriptions
- Dismissible via Esc or click outside

---

## 11. Admin Features

### 11.1 User Management
| Action | Description |
|--------|-------------|
| **View users** | List all users with name, email, admin status, login count, last login |
| **Promote/demote** | Toggle admin privileges |
| **Delete user** | Remove user and cascade-delete owned scopes/data |
| **Edit name** | Change user display name |
| **Transfer ownership** | Reassign scope ownership to another user |

### 11.2 Completion Configuration
- Configure required fields per scope tab (11 tabs configurable)
- Set minimum row counts for row-based tabs
- Changes apply immediately to all scopes
- Preview affected fields before saving

### 11.3 Activity Log Management
- View system-wide activity with pagination (50 per page)
- Filter by date range
- Clear activity logs by date range (with confirmation)
- Shows user, action, detail, IP, location, browser, timestamp

### 11.4 Database Backup (PostgreSQL)
- Nightly automated backups via `pg_dump` (cron, 2 AM UTC)
- 7-day retention policy
- Manual backup available from admin panel

---

## 12. Integration

### 12.1 Salesforce
| Feature | Details |
|---------|---------|
| **Authentication** | OAuth 2.0 redirect flow |
| **Account search** | Query Salesforce accounts by name |
| **Data import** | Pre-fill scope from Salesforce account data |
| **Contact sync** | Import Salesforce contacts as scope contacts |
| **Token storage** | Encrypted in workflow_technical table |

### 12.2 API
- RESTful JSON API with 40+ endpoints
- JWT authentication via session cookies
- Role-based access control on all endpoints
- Consistent error responses: `{ error: "message" }` with appropriate HTTP status codes

---

## 13. Data Security

### 13.1 Encryption
- Sensitive fields (passwords, API keys) encrypted at rest using AES-256-CBC
- Encryption key stored as environment variable (`ENCRYPTION_KEY`)
- Automatic encrypt on write, decrypt on read

### 13.2 Session Security
- 24-hour JWT session expiry
- Secure HTTP-only session cookies
- Rate limiting on API endpoints

### 13.3 Access Control
- All API endpoints verify authentication
- Role checks before mutations (editor/owner/admin)
- Scope-level permission enforcement
- Admin panel restricted to `is_admin` users

### 13.4 Audit & Compliance
- All data changes logged with before/after state
- User activity tracked with IP and geolocation
- Admin can review and export audit trails

---

## 14. Technical Architecture

| Component | Technology |
|-----------|-----------|
| **Frontend** | Next.js 14.2 (React, App Router) |
| **Styling** | Tailwind CSS with CSS custom properties |
| **Authentication** | NextAuth.js with JWT strategy |
| **Database** | PostgreSQL 16 (production), SQLite/sql.js (development) |
| **Deployment** | Standalone Next.js on EC2, nginx reverse proxy |
| **Icons** | Lucide React |
| **Themes** | next-themes with 4 presets |

### 14.1 Database Schema
- **25 tables** covering scope data, user management, audit, reference data, and configuration
- **Dual-mode adapter:** Transparent switching between SQLite (dev) and PostgreSQL (production)
- **Migrations:** Auto-run on startup, handles schema evolution

### 14.2 Deployment Architecture
```
Browser → nginx (:3000) ─┬─ /_next/static/ → filesystem (direct serve)
                         └─ /* → Next.js (:3001) → PostgreSQL
```

---

## Appendix A: Reference Data

### Pre-loaded Marketplace Products
- 100+ partner solutions across categories: Safety, Fleet Management, Compliance, ELD, Cameras, Maintenance, Fuel, HR, and more

### Master Data Categories
- Fleet sizes, company types, TMS types, technology stacks, integration methods, deployment stages

### Feature Catalog
- 100+ predefined solution features auto-seeded into each new scope

---

## Appendix B: Status Badge Colors

| Status | Background | Text | Border |
|--------|-----------|------|--------|
| Draft | amber-500/10 | amber-400 | amber-500/20 |
| Active | blue-500/10 | blue-400 | blue-500/20 |
| Complete | emerald-500/10 | emerald-400 | emerald-500/20 |
| Archived | gray-500/10 | gray-400 | gray-500/20 |
