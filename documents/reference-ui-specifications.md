# UI Specifications & Design Conventions

## Design Tokens

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| Cyan primary | `bg-cyan-500` / `hover:bg-cyan-600` | Primary buttons |
| Cyan text | `text-cyan-500` | Required labels, links |
| Active tab | `#00AEEF` | Active sidebar tab |
| Table header bg | `bg-[#F2FBFE]` | Table header row |
| Table header text | `text-black` | Table header text |
| Dark header/sidebar | Dark theme | App header and sidebar gradient |
| Cancel text | `text-gray-400` / `hover:text-gray-600` | Cancel links |

### Border Radius

- **Global**: `rounded-[10px]` everywhere (cards, dialogs, inputs, tables, buttons)

### Table Styling (set globally in `components/ui/table.tsx`)

- Header: `bg-[#F2FBFE]`, `text-black`, `px-5`
- Rows: Standard white background
- Section headings: `Title (count)` format, no icons in CardTitle

## Dialog Conventions

### Layout
- Max width: `max-w-xl`
- Horizontal label+input layout (label on left, input on right)
- `<hr>` full-width dividers between sections
- 50px left/right padding for wide dialogs (like AddAssetDialog)

### Buttons
- Submit: `bg-cyan-500 hover:bg-cyan-600 text-white rounded-[10px]`
- Cancel: `text-sm text-gray-400 hover:text-gray-600` (text link, not button)

### Labels
- Required fields: `(required)` suffix in cyan (`text-cyan-500`)

### Dropdowns
- Native `<select>` for standard dropdowns
- Custom searchable input for client selection (sorted alphabetically)

## Reusable Dialogs (`src/components/dialogs/`)

| Dialog | File | Props | Notes |
|--------|------|-------|-------|
| AddClientDialog | `add-client-dialog.tsx` | open, onClose, editData? | Company name, ABN, address. Supports add/edit mode. Single site checkbox. |
| AddSiteDialog | `add-site-dialog.tsx` | open, onClose, clientId?, editData? | Optional `clientId` prop hides client selector |
| AddAssetDialog | `add-asset-dialog.tsx` | open, onClose, clientId?, sites?, editData? | Type/Make/Model 3-column selector, searchable client dropdown, 50px padding |
| AddSupportTicketDialog | `add-support-ticket-dialog.tsx` | open, onClose | Searchable client dropdown, cascading site/asset/contact dropdowns, new requester mode |
| InsuranceDialog | `insurance-dialog.tsx` | | Technician insurance management |
| ResourceDialog | `resource-dialog.tsx` | | Resource add/edit |
| TechnicianDialog | `technician-dialog.tsx` | | Technician add/edit |

### Dialog Modes
- **Standalone**: Shows client selector dropdown (for use from listing pages)
- **Embedded**: Receives `clientId` prop, hides client selector (for use within client detail page)

## Layout Components (`src/components/layout/`)

- Dark header with logo and user menu
- Cyan sidebar with navigation links
- Active tab highlight: `#00AEEF`

## Page Conventions

### Listing Pages
- Search bar + filter options
- Paginated table (default 20 per page)
- Sort by `createdAt` descending (newest first)
- Status filter tabs where applicable

### Detail Pages
- Tab-based layout (Overview, Activity, etc.)
- Stat cards at top
- Two-column layouts for detail sections

### Section Headings
- Format: `Title (count)` — e.g., "Sites (3)", "Assets (12)"
- No icons in CardTitle

## Support Ticket Specifics

### Listing Page
- Stat cards with circle color matching count color
- Tab filters by status
- Inline edit/arrow icons in table rows

### Detail Page (`/support-tickets/[id]`)
- 2-column scrollable layout
- Status progress bar
- Inline editing for fields
- Timer for time tracking
- Job cards section
- Ticket history / activity log
- Comments with visibility toggle (public/internal)

## Asset Page Specifics

### Listing Page
- Client/site filters (searchable client dropdown, alphabetically sorted)
- Table columns: Machine Name, Serial Number, Client Name, Client Site, Last Ticket, View Asset

### Detail Page (`/assets/[id]`)
- Tabs: Overview, Maintenance, Activity
- Stat cards
- Notes editing
- Image placeholder with upload
- Serial/date/make/model details
- QR code section

## Client Detail Page

- Tabs: Overview, Service Agreements, Work History, Sites, Contacts, Assets, Portal Users
