# Scope Platform — Platform Science Solution Scoping Tool

A Next.js web application for creating, managing, and sharing Platform Science solution scoping datasets. Replaces the static Excel workbook with a collaborative, role-based, Salesforce-integrated experience.

## Quick Start

```bash
npm install
mkdir -p data
npm run build
npm start
```

Open http://localhost:3000, register an account, and create your first scope.

## Tech Stack

- **Next.js 14** (App Router, Server Actions)
- **SQLite** via sql.js (pure WASM, zero native deps)
- **NextAuth.js v5** (Credentials provider, JWT sessions)
- **Tailwind CSS** + **Lucide React** icons

## Features

- Multi-instance scope documents (one per fleet customer)
- Tabbed editor mirroring all 18 original Excel tabs
- Cross-tab references preserved as DB relationships
- Owner / Editor / Viewer role-based permissions
- Salesforce-compatible share links
- Clone scopes as templates
- Auto-computed stats from all tab data
