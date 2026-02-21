# Application Development Standards
**Extracted from: Solution Scoping Platform**
**Purpose: Reusable defaults for future Next.js projects**

---

## 1. CRUD Patterns

### API Route Structure
```
src/app/api/
  [entity]/
    route.ts          → GET (list), POST (create)
    [id]/
      route.ts        → GET (detail), PATCH (update), DELETE (remove)
```

### Standard API Response Format
```typescript
// Success
return NextResponse.json({ ok: true });
return NextResponse.json(data);
return NextResponse.json({ id: newId });

// Error
return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
return NextResponse.json({ error: "Forbidden" }, { status: 403 });
return NextResponse.json({ error: "Not found" }, { status: 404 });
return NextResponse.json({ error: "Descriptive message" }, { status: 400 });
return NextResponse.json({ error: "Server error" }, { status: 500 });
```

### Standard Auth Guard (every API route)
```typescript
const session = await auth();
if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

### Standard Role Check
```typescript
const role = await getUserRole(entityId, session.user.id);
if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
if (role === "viewer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
```

### Upsert Pattern (create or update in one call)
```typescript
// Frontend sends data with or without `id`
// Backend: if id exists → UPDATE, if no id → INSERT with generated id
async function upsertRow(table: string, data: Record<string, unknown>) {
  if (data.id) {
    // UPDATE existing
  } else {
    // INSERT with generateId()
  }
}
```

### Delete Protection Pattern
```typescript
// Tiered delete permissions based on entity status
if (entity.status === "active") {
  return NextResponse.json({ error: "Active items cannot be deleted." }, { status: 400 });
}
if (entity.status === "complete" && !isAdmin) {
  return NextResponse.json({ error: "Only admins can delete completed items." }, { status: 403 });
}
```

### Bulk Operations Pattern
```typescript
// Frontend: array of IDs, iterate with error collection
let successCount = 0;
const failedIds: string[] = [];
for (const id of ids) {
  const res = await fetch(`/api/entity/${id}`, { method: "DELETE" });
  if (res.ok) successCount++;
  else failedIds.push(id);
}
// Report: "Deleted 3, skipped 2 (protected)"
```

---

## 2. Display Standards

### Theme System (4 themes)
```css
/* CSS custom properties — define in globals.css */
:root, .light   { --bg: #ffffff; --bg-secondary: #f5f5f5; --bg-card: #ffffff; --border: #e5e5e5; --text: #171717; --text-secondary: #525252; --text-muted: #a3a3a3; }
.dim             { --bg: #1a1a2e; --bg-secondary: #16213e; --bg-card: #1a1a2e; --border: #2a2a4a; --text: #e0e0e0; --text-secondary: #a0a0b0; --text-muted: #606070; }
.dark            { --bg: #0a0a0a; --bg-secondary: #141414; --bg-card: #111111; --border: #2a2a2a; --text: #fafafa; --text-secondary: #a3a3a3; --text-muted: #525252; }
.midnight        { --bg: #000000; --bg-secondary: #0a0a0a; --bg-card: #050505; --border: #1a1a1a; --text: #ffffff; --text-secondary: #a0a0a0; --text-muted: #505050; }
```

**Implementation:** Use `next-themes` with `attribute="class"` and `storageKey="theme"`.

### Color Conventions
| Element | Color |
|---------|-------|
| Primary action | `blue-600` / `blue-500` hover |
| Destructive | `red-400` text, `red-500/5` bg |
| Success | `emerald-400` / `green-400` |
| Warning | `amber-400` |
| Info | `blue-400` |
| Muted | `var(--text-muted)` |

### Status Badges
```jsx
const statusColors = {
  draft:    "bg-amber-500/10 text-amber-400 border-amber-500/20",
  active:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  complete: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  archived: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};
// Usage:
<span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] uppercase tracking-wider font-semibold ${statusColors[status]}`}>
  {status}
</span>
```

### Card Pattern
```jsx
<div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
  {/* content */}
</div>
```

### Modal Pattern
```jsx
{showModal && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
       onClick={() => setShowModal(false)}>
    <div className="bg-[var(--bg)] border border-[var(--border)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
         onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
        <h2 className="text-lg font-bold">Title</h2>
        <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
      </div>
      {/* Body */}
      <div className="overflow-y-auto flex-1 px-6 py-4">
        {/* content */}
      </div>
      {/* Footer */}
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--border)] flex-shrink-0">
        <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-[var(--text-muted)]">Cancel</button>
        <button className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium">Confirm</button>
      </div>
    </div>
  </div>
)}
```

### Table Pattern
```jsx
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    <thead>
      <tr className="text-left text-[var(--text-muted)] text-xs uppercase tracking-wider border-b border-[var(--border)]">
        <th className="px-3 py-2">Column</th>
      </tr>
    </thead>
    <tbody>
      {items.map(item => (
        <tr key={item.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)]/50">
          <td className="px-3 py-2">{item.value}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Empty State Pattern
```jsx
<div className="text-center py-16">
  <Icon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
  <h3 className="text-lg font-semibold mb-2">No items yet</h3>
  <p className="text-sm text-[var(--text-muted)] mb-6">Get started by creating your first item.</p>
  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium">
    Create Item
  </button>
</div>
```

---

## 3. UX Standards

### Auto-Save
```typescript
// useDebounce hook — delay API calls during rapid input
const debouncedSave = useDebounce((section, data) => {
  fetch(`/api/entity/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ section, data }),
  });
}, 500);

// On field change:
onChange={e => { setField(e.target.value); debouncedSave("section", { field: e.target.value }); }}
```

### Toast Notifications
```typescript
// Hook pattern
const { toast } = useToast();

// Usage
toast("Saved successfully");                    // default (info)
toast("Record deleted", "success");             // green
toast("Failed to save", "error");               // red

// Implementation: fixed bottom-right, auto-dismiss 4s, stack multiple
```

### Confirmation Dialogs (all destructive actions)
```jsx
<ConfirmDialog
  open={!!deleteTarget}
  title="Delete Item"
  message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
  confirmLabel="Delete"
  destructive={true}
  onConfirm={handleDelete}
  onCancel={() => setDeleteTarget(null)}
/>
```

### Keyboard Shortcuts
```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === "Escape") router.push("/dashboard");
    if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSave(); }
    if (e.key === "?") setShowShortcuts(true);
    if (e.key >= "1" && e.key <= "9") setTab(TABS[parseInt(e.key) - 1]?.id);
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, []);
```

### Drag & Drop (row reordering)
```typescript
// State
const [dragIdx, setDragIdx] = useState<number | null>(null);

// Row attributes
<tr
  draggable
  onDragStart={() => setDragIdx(index)}
  onDragOver={e => e.preventDefault()}
  onDrop={() => { reorder(dragIdx, index); setDragIdx(null); }}
  className={dragIdx === index ? "opacity-50" : ""}
/>
```

### Input Validation
```typescript
// Email
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// Phone — auto-format to (XXX) XXX-XXXX
const formatPhone = (v: string) => {
  const digits = v.replace(/\D/g, "").slice(0, 10);
  if (digits.length >= 7) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  if (digits.length >= 4) return `(${digits.slice(0,3)}) ${digits.slice(3)}`;
  return digits;
};

// URL
const isValidUrl = (v: string) => /^https?:\/\/.+\..+/.test(v);

// Visual: amber border on invalid, green check on valid
className={`border ${isValid ? "border-[var(--border)]" : "border-amber-500"}`}
```

### Required Field Indicator
```jsx
// Label with required marker
<label className="text-sm font-medium text-[var(--text-secondary)]">
  Field Name {isRequired && <span className="text-amber-400">*</span>}
</label>

// Input with required highlight
<input className={`... ${isRequired && !value ? "border-amber-500/50" : "border-[var(--border)]"}`} />
```

### Loading States
```jsx
// Spinner
<div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full" />

// Skeleton
<div className="animate-pulse bg-[var(--bg-secondary)] rounded h-4 w-32" />

// Full page loading
<div className="flex items-center justify-center h-64">
  <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full" />
</div>
```

### Search & Filter Bar
```jsx
<div className="flex items-center gap-3 flex-wrap">
  <div className="relative flex-1 min-w-[200px]">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
    <input
      type="text"
      placeholder="Search..."
      value={search}
      onChange={e => setSearch(e.target.value)}
      className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-sm"
    />
  </div>
  <select className="px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-sm">
    <option value="all">All statuses</option>
  </select>
</div>
```

---

## 4. Architecture Standards

### File Organization
```
src/
  app/
    (auth)/           → Login, register (no sidebar)
    (dashboard)/      → Main app pages (with sidebar/header)
    (admin)/          → Admin-only pages
    api/              → API routes
  lib/
    auth.ts           → NextAuth config, session helpers
    db.ts             → Database connection, schema, migrations
    [entity].ts       → Data access layer (all SQL here)
    utils.ts          → ID generation, formatting helpers
    completion.ts     → Business logic (completion calculation)
  components/
    [Feature].tsx     → Feature-specific components
    scope/            → Domain-specific components
  hooks/
    useDebounce.ts    → Reusable hooks
```

### Database Access Pattern
```typescript
// All SQL lives in lib/[entity].ts — never in API routes
// API routes call functions, functions call db

// In lib/scopes.ts:
export async function getEntity(id: string) {
  const db = await getDb();
  const result = await db.exec("SELECT * FROM table WHERE id = ?", [id]);
  return execToObjects(result)[0] || null;
}

// In api route:
import { getEntity } from "@/lib/scopes";
const entity = await getEntity(id);
```

### Auth Pattern (NextAuth)
```typescript
// lib/auth.ts
export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [CredentialsProvider({ ... })],
  session: { strategy: "jwt", maxAge: 86400 },
  callbacks: {
    jwt({ token, user }) { /* add custom fields to token */ },
    session({ session, token }) { /* add custom fields to session */ },
  },
});
```

### Audit Trail Pattern
```typescript
// Before mutation: capture state
const beforeState = await getEntity(id);

// Perform mutation
await updateEntity(id, data);

// After mutation: capture state, log diff
const afterState = await getEntity(id);
logAudit(entityId, userId, section, action, beforeState, afterState);
```

### Activity Logging Pattern
```typescript
// Fire-and-forget (don't block the response)
buildActivityMeta(id).then(m => logActivity(userId, "action_name", m)).catch(() => {});
```

### Notification Pattern
```typescript
// After mutation, notify relevant users (fire-and-forget)
try {
  const collabs = await getCollaborators(id);
  for (const c of collabs) {
    if (c.user_id !== session.user.id) {
      await createNotificationIfEnabled(c.user_id, entityId, "type", "message");
    }
  }
} catch {}
```

---

## 5. Deployment Standards

### Build & Deploy (Next.js Standalone)
```bash
# Local build
npm run build

# Package
tar -cf deploy.tar .next/standalone .next/static

# Upload
scp deploy.tar server:/tmp/

# Deploy (on server)
killall node
rm -rf .next node_modules server.js package.json
tar -xf /tmp/deploy.tar
cp -r .next/standalone/* .
cp -r .next/standalone/.next/* .next/
chmod -R o+rx .next/static          # for nginx
PORT=3001 nohup node server.js &
```

### nginx Reverse Proxy (fixes parenthesized route groups)
```nginx
server {
    listen 3000;
    location /_next/static/ {
        alias /path/to/app/.next/static/;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Environment Variables
```bash
# Required
AUTH_SECRET=           # NextAuth secret (generate with openssl rand -base64 32)
ENCRYPTION_KEY=        # AES-256 key for sensitive field encryption
NEXTAUTH_URL=          # App URL (e.g., http://13.x.x.x:3000)

# Database (production)
DATABASE_MODE=postgres
DATABASE_URL=postgres://user:pass@localhost:5432/dbname

# Database (development — default)
DATABASE_MODE=sqlite

# Optional integrations
SF_CLIENT_ID=          # Salesforce OAuth
SF_CLIENT_SECRET=
SF_REDIRECT_URI=
```

---

## 6. Icon Library

**Standard:** Lucide React (`lucide-react`)

| Use Case | Icon |
|----------|------|
| Add/Create | `Plus` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Search | `Search` |
| Filter | `Filter` |
| Sort | `ArrowUpDown` |
| Settings | `Settings` |
| Close | `X` |
| Back | `ArrowLeft` |
| Forward/Navigate | `ChevronRight` |
| Menu/More | `MoreVertical` |
| Download/Export | `Download` |
| Upload/Import | `Upload` |
| Copy/Clone | `Copy` |
| Share | `ExternalLink` |
| Help | `HelpCircle` |
| Warning | `AlertTriangle` |
| Success/Complete | `CheckCircle` |
| User | `Users` |
| Document | `FileText` |
| Dashboard | `Layers` |
| Activity | `Activity` |
| Clock/Time | `Clock` |
| Notification | `Bell` |
| Logout | `LogOut` |
| Refresh | `RefreshCw` |
| Calendar | `Calendar` |
| Analytics | `BarChart3` |

---

## 7. Checklist for New Projects

- [ ] Next.js 14+ with App Router
- [ ] Tailwind CSS with CSS custom properties for theming
- [ ] 4 theme presets (Light, Dim, Dark, Midnight) via next-themes
- [ ] NextAuth with JWT sessions (24h expiry)
- [ ] Role-based access: Viewer, Editor, Owner, Admin
- [ ] Lucide React for icons
- [ ] Toast notification system (success/error/info)
- [ ] Confirmation dialogs for all destructive actions
- [ ] Auto-save with debounce (500ms)
- [ ] Keyboard shortcuts (Esc, Ctrl+S, ?, number keys)
- [ ] Search + filter + sort on list pages
- [ ] Bulk select + bulk actions
- [ ] Audit trail (before/after snapshots)
- [ ] Activity logging (user, action, IP, timestamp)
- [ ] Required field highlighting
- [ ] Completion/progress tracking
- [ ] Export: CSV, JSON, PDF
- [ ] Help guide modal
- [ ] nginx reverse proxy for static files
- [ ] PostgreSQL for production, SQLite for dev
