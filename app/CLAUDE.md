# Total Spray Care (TSC) - Admin Dashboard

## Stack
- **Framework**: Next.js 16 (App Router) + React 19
- **Database**: MongoDB via Mongoose 9
- **Auth**: NextAuth 5 beta (JWT, credentials provider, bcrypt)
- **UI**: Radix UI + Tailwind CSS 4 + Lucide icons
- **Validation**: React Hook Form + Zod

## Project Structure
```
src/
  app/(admin)/     # Admin pages (dashboard, clients, job-cards, assets, etc.)
  app/(public)/    # Public access pages (job-card view, support portal)
  app/api/         # REST API routes (all return { success, data/error })
  components/      # Shared UI components + dialogs
  models/          # Mongoose models (58 total, includes ServiceAgreement)
  lib/             # DB connection, auth config, API helpers, utils
  types/           # TypeScript type definitions
  proxy.ts         # Route protection middleware
```

## Key Conventions
- API responses: `{ success: true, data: ... }` or `{ success: false, error: "..." }`
- Paginated APIs: `{ data: { data: [...], total, page, limit, totalPages } }`
- Auth: `requireAuth()` / `requireAdmin()`
- Mongoose populate requires model import in route file
- Dialog style: horizontal label+input, `<hr>` full-width dividers, cyan button + Cancel text, 50px L/R padding for wide dialogs
- **Global border-radius**: `rounded-[10px]` everywhere
- **Table headers**: `bg-[#F2FBFE]`, `text-black`, `px-5` — set globally in `components/ui/table.tsx`
- **Section headings**: `Title (count)` format, no icons in CardTitle
- **Reusable dialogs** in `components/dialogs/` — support both standalone (with client selector) and embedded (with `clientId` prop) modes
- Ticket numbers start at 10000

## Completed Work

### Layout & Theming
- Dark header, cyan sidebar, global `rounded-[10px]`, active tab `#00AEEF`

### Settings
- Tags, Titles, Job Card Types, Resource Categories, Email Notifications, Asset Settings, Checklist Templates

### Pages
- **Dashboard**: stat cards, recent tickets/job cards, status breakdowns
- **Clients**: listing + detail with Overview/Service Agreements/Work History/Sites/Contacts/Assets/Portal Users tabs
- **Technicians**: listing, view page with tabs, tags, notes, sub-technicians, insurance, archive
- **Resources**: category tabs, card grid, add/edit dialog
- **Support Tickets**: listing with stat cards (circle color matches count color), tab filters, inline edit/arrow icons
- **Assets**: listing with client/site filters (searchable client dropdown, sorted alphabetically), table with Machine Name/Serial Number/Client Name/Client Site/Last Ticket/View Asset
- **Asset Detail** (`/assets/[id]`): Overview/Maintenance/Activity tabs, stat cards, notes editing, image placeholder, serial/date/make/model details, QR code section

### Reusable Dialogs (`components/dialogs/`)
- **AddClientDialog**: add/edit client
- **AddSiteDialog**: add/edit site, optional `clientId` prop (hides client selector when provided)
- **AddAssetDialog**: add/edit asset with Type/Make/Model 3-column selector, optional `clientId`+`sites` props, searchable client dropdown sorted alphabetically, 50px padding layout
- **AddSupportTicketDialog**: client search, cascading site/asset/contact dropdowns, new requester mode

### APIs
- `/api/assets` — GET all assets with populated client/site + last ticket date, supports `?clientId`/`?siteId` filters
- `/api/assets/[id]` — GET single asset with populated fields + support request count, PUT for notes
- `/api/clients/[id]/sites` — CRUD for client sites
- `/api/clients/[id]/assets` — CRUD for client assets
- `/api/support-tickets` — ticket listing + creation (ticketNo starts at 10000)

## Running
```bash
npm run dev    # Start dev server
npx tsc --noEmit  # Type check
```
