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
  app/(admin)/     # Admin pages (dashboard, clients, job-cards, etc.)
  app/(public)/    # Public access pages (job-card view, support portal)
  app/api/         # REST API routes (all return { success, data/error })
  components/      # Shared UI components
  models/          # Mongoose models (58 total, includes ServiceAgreement)
  lib/             # DB connection, auth config, API helpers, utils
  types/           # TypeScript type definitions
  proxy.ts         # Route protection middleware
```

## Key Conventions
- API responses: `{ success: true, data: ... }` or `{ success: false, error: "..." }`
- Paginated APIs: `{ data: { data: [...], total, page, limit, totalPages } }`
- Error field: check `json.error || json.message`
- Auth: `requireAuth()` / `requireAdmin()`
- Mongoose populate requires model import in route file
- Junction tables: AssetMakeModel, ChecklistTemplateTag, TechnicianTag
- Dialog style: horizontal label+input, `<hr>` dividers, cyan button + Cancel text
- **Global border-radius**: `rounded-[10px]` everywhere (set in globals.css theme + all components)
- **Sidebar**: light cyan bg (`#e4f5fa`), active/hover `bg-[#B7EBFF] text-[#2EA4D0]`, icons 16px, text `#323E42` 12px normal, 20px left padding
- **Header**: full-width dark bg (`#1c2b3a`), logo.svg 100px, centered search, welcome text + logout, cyan gradient bottom line
- Sidebar icons use CSS filter for color tint on hover/active (`.sidebar-icon-tint`/`.sidebar-icon-active` in globals.css)
- Dashboard stat cards use sidebar SVG icons (`/clients.svg`, `/support_tickets.svg`, `/briefcase.svg`, `/tool.svg`)
- **Table headers**: `bg-[#F2FBFE]`, `text-black`, `px-5` (20px) — set globally in `components/ui/table.tsx` (`TableHeader` bg, `TableHead` defaults). Do NOT add per-table color overrides.
- **Section headings**: Single-line `Title (count)` format, no icons in CardTitle. Example: `Sites (2)`, `Contacts (5)`

## Completed Work

### Layout & Theming
- Full-width dark header with logo.svg, search bar, welcome text, logout
- Sidebar below header with cyan theme, icon tint on active/hover
- Global `rounded-[10px]` across all UI components and pages
- Active tab underline color: `#00AEEF`

### Settings
- Card grid at `/settings` → dynamic `/settings/[section]`
- Tags, Support Ticket Titles, Job Card Types, Resource Categories, Email Notifications
- Asset Settings: Makes/Models/Types tabs, junction table linking
- Checklist Templates: two-panel, drag-and-drop, tags, section breaks, response types

### Pages
- **Dashboard**: stat cards with sidebar SVG icons, recent tickets/job cards, status breakdowns
- **Clients**: listing + detail page with Overview/Service Agreements/Work History/Sites/Contacts/Assets/Portal Users tabs
  - 98px stat boxes, attachments with lightbox, notes with type icons, support tickets by title
  - Support Ticket URL: activate/deactivate flow with confirmation, copy link, URL display
  - API: `activateAccessToken`/`deactivateAccessToken` fields on PUT `/api/clients/[id]`
  - Service Agreements: full CRUD (model, API, UI) with covered sites, file upload, auto-expire
  - Portal Users: Card layout with table, invite dialog, view/edit/change-password, login history
- **Technicians**: listing, view page with tabs, tags, notes, sub-technicians, insurance, archive
- **Resources**: category tabs, card grid, add/edit dialog with file upload
- **Support Tickets**: redesigned listing

### Reusable Components
- AddClientDialog, ChecklistTemplatesSection, SettingsListSection, ResourceDialog, TechnicianDialog, InsuranceDialog

## Running
```bash
npm run dev    # Start dev server
npx tsc --noEmit  # Type check
```
