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
  models/          # Mongoose models (57 total)
  lib/             # DB connection, auth config, API helpers, utils
  types/           # TypeScript type definitions
  proxy.ts         # Route protection middleware (renamed from middleware.ts for Next.js 16)
```

## Key Conventions
- API responses: `{ success: true, data: ... }` or `{ success: false, error: "..." }`
- Paginated APIs return: `{ data: { data: [...], total, page, limit, totalPages } }`
- Error field is `json.error` (not `json.message`) — always check `json.error || json.message`
- Auth: `requireAuth()` for logged-in users, `requireAdmin()` for admin-only
- Mongoose populate requires referenced model to be imported in the route file
- Junction tables for many-to-many: AssetMakeModel, ChecklistTemplateTag, TechnicianTag
- Dialog style: horizontal label+input layout, `<hr>` dividers, cyan button + Cancel text
- Action buttons use `whitespace-nowrap shrink-0` to prevent wrapping

## Completed Work

### Infrastructure
- Renamed `middleware.ts` to `proxy.ts` for Next.js 16 compatibility
- Updated favicon, sidebar logo, and header layout

### Settings Page Redesign
- Card grid layout at `/settings` linking to sub-routes
- Dynamic section page at `/settings/[section]` renders section-specific components
- **Tags Settings**: Full CRUD with color-coded tag management
- **Support Ticket Titles**: List-based CRUD via `SettingsListSection`
- **Job Card Types**: List-based CRUD via `SettingsListSection`
- **Resource Categories**: List-based CRUD via `SettingsListSection`
- **Email Notifications**: Dedicated section component

### Asset Settings (`/settings/asset-settings`)
- Three-tab layout: Makes, Models, Types (underline-style tabs)
- **Asset Makes**: CRUD + model linking via checkbox popup using `AssetMakeModel` junction table
- **Asset Models**: Simple CRUD (title only), make assignment from Makes tab only
- **Asset Types**: CRUD with type management
- Models already linked to other makes are filtered from selection list (1 model = 1 make)
- All action buttons stay on 1 line (no text wrapping)

### Checklist Templates (`/settings/checklist-templates`)
- Two-panel layout: template list (left) + detail panel (right)
- Left panel: search, "Add New Template" button, template cards with edit/delete
- Right panel when template selected:
  - Editable title (click to edit inline)
  - **Tags**: Cyan pill badges with X to remove, "+" button opens toggle dialog
  - **Add Tags dialog**: Available tags as toggleable pill buttons (cyan=assigned, gray=unassigned)
  - **"+ Add Section Break"** and **"+ Add Checklist Item"** action links
  - **Section Break dialog**: Details input, cyan button
  - **Add Checklist Item dialog**: Details, Response Type dropdown, mandatory checkbox, image upload
  - **Edit Checklist Item dialog**: Same fields + shows existing image filename with delete/replace
  - **Items list**: move.svg drag handle, sequential numbering, details with red asterisk if mandatory, colored type badge, edit/delete icons
  - **Section breaks**: Dark bg row with bold title + "Section Break" label
  - **Drag and drop**: HTML5 drag API, order persisted via batch PUT
  - Item row CSS: `border: 1px solid #d0dfe6; padding: 27px 15px 27px 35px; border-radius: 5px; margin-bottom: 10px; line-height: 30px`
- Response types: Checkbox, Pass/Fail/N/A, Image, Comment, Yes/No, Poor/Fair/Good, Signature, Set Date & Time, Text Only - No Response
- Section Break uses `checklistItemType = 0`
- API fields: `checklistItemType` (number), `makeResponseMandatory` (0/1), `orderNo`, `fileName`, `fileSize`
- Tags use junction table: POST `{ checklistTagId }`, DELETE uses checklistTagId in URL

### Reusable Components
- **AddClientDialog** (`components/dialogs/add-client-dialog.tsx`): Shared dialog used in support-tickets and clients/add
- **ChecklistTemplatesSection** (`components/settings/checklist-templates-section.tsx`): Full two-panel checklist management
- **Settings sections** (`components/settings/settings-sections.tsx`): TagsSettings, SettingsListSection, AssetSettings, EmailNotification, TableCrudSection

### API Fixes Applied
- Removed `.populate()` calls from asset settings routes (resolves client-side instead)
- Added `import "@/models/ChecklistTag"` to checklist detail and tags routes for populate
- Reverted AssetModel schema to original (removed `assetMakeId` field, uses junction table instead)
- Fixed error handling across settings: check `json.error || json.message`
- Fixed paginated response handling: `Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []`

## Running
```bash
npm run dev    # Start dev server
npx tsc --noEmit  # Type check
```
