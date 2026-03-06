# Total Spray Care (TSC) — Start Here

## Overview

TSC is an admin dashboard for a pest/spray care business. It manages clients, sites, assets (equipment), job cards, support tickets, technicians, and resources.

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.1.6 | App Router framework |
| React | 19.2.3 | UI library |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Styling |
| Radix UI (ShadCN) | Latest | UI component library |
| MongoDB | Atlas | Database |
| Mongoose | 9.2.1 | ODM for MongoDB |
| NextAuth | 5 beta | Authentication (JWT + credentials) |
| React Hook Form | 7.71 | Form handling |
| Zod | 4.3 | Validation |
| Recharts | 3.7 | Charts |
| Lucide React | 0.575 | Icons |
| jsPDF | 4.2 | PDF generation |
| QRCode | 1.5 | QR code generation |

## Project Structure

```
app/src/
  app/
    (admin)/      — Admin pages (dashboard, clients, job-cards, assets, technicians,
                    support-tickets, resources, settings, users, checklists, contacts, archive)
    (auth)/       — Auth pages (login, forgot-password, reset-password, otp, invite)
    (public)/     — Public pages (job-card, client-asset, support, log-maintenance, history)
    api/          — REST API routes
  components/
    dialogs/      — Reusable dialog components (add-client, add-site, add-asset, add-support-ticket, etc.)
    layout/       — Layout components (sidebar, header)
    settings/     — Settings page components
    ui/           — ShadCN UI primitives
  models/         — 59 Mongoose model files
  lib/            — DB connection, auth, API helpers, utils
  types/          — TypeScript type definitions
  proxy.ts        — Route protection middleware
```

## Quick Start

```bash
cd app
npm install
npm run dev      # Starts dev server (default port 3000)
npx tsc --noEmit # Type check
```

## Key Patterns

- **API responses**: `{ success: true, data: ... }` or `{ success: false, error: "..." }`
- **Paginated APIs**: `{ data: { data: [...], total, page, limit, totalPages } }`
- **Auth helpers**: `requireAuth()` / `requireAdmin()` in `src/lib/api-helpers.ts`
- **DB connection**: Singleton pattern in `src/lib/db.ts`
- **Mongoose populate**: Model must be imported in the route file for populate to work

## Documentation Map

| File | Description |
|------|-------------|
| `reference-database-schema.md` | All 59 Mongoose models and relationships |
| `reference-api-routes.md` | Complete API route reference |
| `reference-ui-specifications.md` | Design tokens, colors, styling conventions |
| `reference-features-and-workflows.md` | Features, roles, and business workflows |
| `implementation-progress.md` | Current status and completed work |

## User Roles

| Role | Value | Access |
|------|-------|--------|
| Super Admin | 1 | Full access |
| Admin | 2 | Full access |
| Manager | 3 | Full access |
| Client User | 4 | Limited admin routes (dashboard, clients, job-cards, support-tickets, assets, contacts, resources, settings) |
| Client Admin | 6 | Same as Client User |

## Environment Variables

- `MONGODB_URI` — MongoDB connection string
- `NEXTAUTH_SECRET` — NextAuth JWT secret
- `NEXTAUTH_URL` — App URL
- Configured in `.env.local`
