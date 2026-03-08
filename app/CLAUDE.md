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
- Sidebar active state: items with query params (e.g. To Invoice `?tab=to-invoice`) only highlight on exact match; base path items exclude query siblings

### Settings
- Tags, Titles, Job Card Types, Resource Categories, Email Notifications, Asset Settings, Checklist Templates

### Pages
- **Dashboard**: stat cards, recent tickets/job cards, status breakdowns
- **Clients**: listing + detail with Overview/Service Agreements/Work History/Sites/Contacts/Assets/Portal Users tabs
- **Technicians**: listing, view page with tabs, tags, notes, sub-technicians, insurance, archive
- **Resources**: category tabs, card grid, add/edit dialog
- **Support Tickets**: listing with stat cards (circle color matches count color), tab filters, inline edit/arrow icons
- **Support Ticket Detail** (`/support-tickets/[id]`): 2-column scrollable layout with status progress bar, inline editing, timer, job cards, ticket history, comments with visibility toggle. Status workflow: Working/On-site Technician auto-set (non-clickable), Resolved opens dialog with comment + contact notification emails. Claim ticket dialog with owner multi-select from active admin users. Sites/Asset links black underline, cyan links always underlined.
- **Assets**: listing with client/site filters (searchable client dropdown, sorted alphabetically), table with Machine Name/Serial Number/Client Name/Client Site/Last Ticket/View Asset
- **Asset Detail** (`/assets/[id]`): Overview/Maintenance/Activity tabs, stat cards, notes editing, image placeholder, serial/date/make/model details, QR code section
- **Contacts** (`/contacts`): listing all contacts with search, populated client/site names, link to client detail
- **Users** (`/users`): listing with add/edit in popup dialog (not separate pages), roles: Administrator (3) / Support Admin (2), status Active/Deactive column. Deactive users cannot log in.

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
- `/api/contacts` — GET all contacts with populated clientId/clientSiteId
- `/api/support-tickets` — ticket listing + creation (ticketNo starts at 10000)
- `/api/support-tickets/[id]/owners` — GET/POST/PUT (bulk replace) ticket owners; PUT auto-sets Working status if Open
- `/api/support-tickets/[id]/resolve` — PUT resolves ticket: saves comment, updates status, sends notification emails to selected contacts
- `/api/users` — GET supports `?role=1,2,3` (comma-separated) and `?status=1` filters; POST accepts `status` field
- **Email**: `sendTicketResolvedEmail()` in `lib/email.ts` — sends resolve notification via Resend

## Running
```bash
npm run dev    # Start dev server
npx tsc --noEmit  # Type check
```
