# API Routes Reference

All routes in `src/app/api/`. All return `{ success: true, data }` or `{ success: false, error }`.

## Authentication (`/api/auth/`)

```
POST /api/auth/[...nextauth]       — NextAuth handlers (login/logout/session)
POST /api/auth/forgot-password     — Send password reset email
POST /api/auth/reset-password      — Reset password with token
POST /api/auth/verify-otp          — Verify OTP code
POST /api/auth/resend-otp          — Resend OTP code
POST /api/auth/accept-invite       — Accept user invitation
```

## Dashboard (`/api/dashboard/`)

```
GET /api/dashboard                 — Dashboard stats, recent tickets, recent job cards, charts
```

## Clients (`/api/clients/`)

```
GET    /api/clients                — List all clients (paginated, searchable)
POST   /api/clients                — Create client
GET    /api/clients/[id]           — Get client detail
PUT    /api/clients/[id]           — Update client
DELETE /api/clients/[id]           — Delete client

# Sites
GET    /api/clients/[id]/sites                 — List client sites
POST   /api/clients/[id]/sites                 — Create site
GET    /api/clients/[id]/sites/[siteId]        — Get site
PUT    /api/clients/[id]/sites/[siteId]        — Update site
DELETE /api/clients/[id]/sites/[siteId]        — Delete site

# Contacts
GET    /api/clients/[id]/contacts              — List client contacts
POST   /api/clients/[id]/contacts              — Create contact (name, lastName, position, email, phone, clientSiteId)
PUT    /api/clients/[id]/contacts/[contactId]  — Update contact
DELETE /api/clients/[id]/contacts/[contactId]  — Delete contact

# Assets
GET    /api/clients/[id]/assets                — List client assets
POST   /api/clients/[id]/assets                — Create asset
PUT    /api/clients/[id]/assets/[assetId]      — Update asset
DELETE /api/clients/[id]/assets/[assetId]      — Delete asset

# Notes
GET    /api/clients/[id]/notes                 — List client notes
POST   /api/clients/[id]/notes                 — Create note
PUT    /api/clients/[id]/notes/[noteId]        — Update note
DELETE /api/clients/[id]/notes/[noteId]        — Delete note

# Documents
GET    /api/clients/[id]/documents             — List client documents
POST   /api/clients/[id]/documents             — Create document
PUT    /api/clients/[id]/documents/[documentId]    — Update document
DELETE /api/clients/[id]/documents/[documentId]    — Delete document

# Service Agreements
GET    /api/clients/[id]/service-agreements            — List service agreements
POST   /api/clients/[id]/service-agreements            — Create agreement
PUT    /api/clients/[id]/service-agreements/[agreementId]  — Update agreement
DELETE /api/clients/[id]/service-agreements/[agreementId]  — Delete agreement
```

## Assets (`/api/assets/`)

```
GET  /api/assets                   — List all assets (supports ?clientId, ?siteId filters)
                                     Populates client, site, last ticket date
POST /api/assets                   — Create asset
GET  /api/assets/[id]              — Get asset detail with populated fields + support request count
PUT  /api/assets/[id]              — Update asset (notes, etc.)
DELETE /api/assets/[id]            — Delete asset
GET  /api/assets/[id]/maintenance-breakdown — Maintenance statistics for charts
```

## Support Tickets (`/api/support-tickets/`)

```
GET    /api/support-tickets        — List tickets (paginated, filterable by status/client)
POST   /api/support-tickets        — Create ticket (clientId, clientSiteId, clientAssetId, clientContactId, description)
                                     ticketNo auto-increments from 10000
GET    /api/support-tickets/stats  — Ticket statistics (counts by status)

GET    /api/support-tickets/[id]           — Get ticket detail
PUT    /api/support-tickets/[id]           — Update ticket
DELETE /api/support-tickets/[id]           — Delete ticket
POST   /api/support-tickets/[id]/status    — Update ticket status
POST   /api/support-tickets/[id]/resolve   — Resolve ticket

# Comments
GET    /api/support-tickets/[id]/comments      — List comments
POST   /api/support-tickets/[id]/comments      — Add comment (with visibility toggle)

# Attachments
GET    /api/support-tickets/[id]/attachments               — List attachments
POST   /api/support-tickets/[id]/attachments               — Upload attachment
DELETE /api/support-tickets/[id]/attachments/[attachmentId] — Delete attachment

# Technicians
GET    /api/support-tickets/[id]/technicians               — List assigned technicians
POST   /api/support-tickets/[id]/technicians               — Assign technician
DELETE /api/support-tickets/[id]/technicians/[technicianId] — Remove technician

# Owners
GET    /api/support-tickets/[id]/owners    — List owners
POST   /api/support-tickets/[id]/owners    — Assign owner

# Time Tracking
GET    /api/support-tickets/[id]/time          — List time entries
POST   /api/support-tickets/[id]/time          — Add time entry
PUT    /api/support-tickets/[id]/time/[timeId] — Update time entry
DELETE /api/support-tickets/[id]/time/[timeId] — Delete time entry
```

## Job Cards (`/api/job-cards/`)

```
GET    /api/job-cards              — List job cards (paginated)
POST   /api/job-cards              — Create job card
GET    /api/job-cards/[id]         — Get job card detail
PUT    /api/job-cards/[id]         — Update job card
DELETE /api/job-cards/[id]         — Delete job card
POST   /api/job-cards/[id]/status  — Update job card status
POST   /api/job-cards/[id]/send    — Send job card

# Assets
GET    /api/job-cards/[id]/assets                      — List assets in job card
POST   /api/job-cards/[id]/assets                      — Add asset to job card
GET    /api/job-cards/[id]/assets/[assetId]/checklist   — Get checklist items
POST   /api/job-cards/[id]/assets/[assetId]/checklist   — Add checklist item

# Comments
GET    /api/job-cards/[id]/comments        — List comments
POST   /api/job-cards/[id]/comments        — Add comment

# Attachments
GET    /api/job-cards/[id]/attachments             — List attachments
POST   /api/job-cards/[id]/attachments             — Upload attachment
DELETE /api/job-cards/[id]/attachments/[attachmentId] — Delete attachment

# Owners & Technicians
GET    /api/job-cards/[id]/owners          — List owners
POST   /api/job-cards/[id]/owners          — Assign owner
GET    /api/job-cards/[id]/technicians             — List technicians
POST   /api/job-cards/[id]/technicians             — Assign technician
DELETE /api/job-cards/[id]/technicians/[technicianId] — Remove technician
```

## Technicians (`/api/technicians/`)

```
GET    /api/technicians            — List technicians (paginated)
POST   /api/technicians            — Create technician
GET    /api/technicians/[id]       — Get technician detail
PUT    /api/technicians/[id]       — Update technician
DELETE /api/technicians/[id]       — Delete technician

# Tags
GET    /api/technicians/[id]/tags          — List technician tags
POST   /api/technicians/[id]/tags          — Add tag
DELETE /api/technicians/[id]/tags/[tagId]  — Remove tag

# Insurance
GET    /api/technicians/[id]/insurance                 — List insurance docs
POST   /api/technicians/[id]/insurance                 — Add insurance
PUT    /api/technicians/[id]/insurance/[insuranceId]   — Update insurance
DELETE /api/technicians/[id]/insurance/[insuranceId]   — Delete insurance
```

## Checklists (`/api/checklists/`)

```
GET    /api/checklists             — List checklist templates
POST   /api/checklists             — Create template
GET    /api/checklists/[id]        — Get template with items
PUT    /api/checklists/[id]        — Update template
DELETE /api/checklists/[id]        — Delete template

# Items
GET    /api/checklists/[id]/items          — List items
POST   /api/checklists/[id]/items          — Add item
PUT    /api/checklists/[id]/items/[itemId] — Update item
DELETE /api/checklists/[id]/items/[itemId] — Delete item

# Template Tags
GET    /api/checklists/[id]/tags           — List template tags
POST   /api/checklists/[id]/tags           — Add tag
DELETE /api/checklists/[id]/tags/[tagId]   — Remove tag

# Global Tags
GET    /api/checklists/tags        — List all checklist tags
POST   /api/checklists/tags        — Create tag
PUT    /api/checklists/tags/[id]   — Update tag
DELETE /api/checklists/tags/[id]   — Delete tag
```

## Resources (`/api/resources/`)

```
GET    /api/resources              — List resources (by category)
POST   /api/resources              — Create resource
GET    /api/resources/[id]         — Get resource
PUT    /api/resources/[id]         — Update resource
DELETE /api/resources/[id]         — Delete resource

# Categories
GET    /api/resources/categories       — List categories
POST   /api/resources/categories       — Create category
PUT    /api/resources/categories/[id]  — Update category
DELETE /api/resources/categories/[id]  — Delete category
```

## Users (`/api/users/`)

```
GET    /api/users                  — List users (paginated)
POST   /api/users                  — Create user
GET    /api/users/[id]             — Get user detail
PUT    /api/users/[id]             — Update user
DELETE /api/users/[id]             — Delete user
POST   /api/users/[id]/invite      — Send/resend invitation
GET    /api/users/[id]/login-history — Get login history
GET    /api/users/profile          — Get current user profile
PUT    /api/users/profile          — Update current user profile
```

## Settings (`/api/settings/`)

```
GET/PUT  /api/settings/global              — Global app settings

# Tags, Titles, Job Card Types
GET/POST    /api/settings/tags             — List/create tags
GET/PUT/DEL /api/settings/tags/[id]        — Manage tag
GET/POST    /api/settings/titles           — List/create titles
GET/PUT/DEL /api/settings/titles/[id]      — Manage title
GET/POST    /api/settings/job-card-types       — List/create types
GET/PUT/DEL /api/settings/job-card-types/[id]  — Manage type

# Asset Settings
GET/POST    /api/settings/asset-types          — List/create asset types
GET/PUT/DEL /api/settings/asset-types/[id]     — Manage type
GET/POST    /api/settings/asset-makes          — List/create makes
GET/PUT/DEL /api/settings/asset-makes/[id]     — Manage make
GET/POST    /api/settings/asset-models         — List/create models
GET/PUT/DEL /api/settings/asset-models/[id]    — Manage model
GET/POST    /api/settings/asset-make-models    — List/create make-model pairs
GET/PUT/DEL /api/settings/asset-make-models/[id] — Manage pair
```

## Public Routes (`/api/public/`) — No Auth Required

```
GET  /api/public/job-card/[uniqueId]           — Public job card view
POST /api/public/log-maintenance/[uniqueId]    — Log maintenance for asset
GET  /api/public/client-asset/[uniqueId]       — Public asset view
GET  /api/public/history/[uniqueId]            — Asset history
GET  /api/public/support/[accessToken]         — Public support ticket portal
```

## Other Routes

```
POST /api/upload                   — File upload (returns URL)
GET  /api/search                   — Global search (clients, assets, tickets, etc.)
POST /api/seed                     — Database seeding (dev only)
```

## Common Query Parameters

All paginated endpoints support:
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 20, max: 100)
- `sort` — Sort field (default: createdAt)
- `order` — Sort order: asc/desc (default: desc)
- `q` — Search query
- `status` — Status filter

## Auth Helpers (`src/lib/api-helpers.ts`)

```typescript
requireAuth()    // Returns session or throws 401
requireAdmin()   // Returns session (role 1/2/3) or throws 403
successResponse(data, status?)     // { success: true, data }
errorResponse(message, status?)    // { success: false, error }
handleApiError(error)              // Catches AuthError → 401/403, else → 500
paginatedResponse(data, total, page, limit)  // Paginated wrapper
getSearchParams(req)               // Extracts page/limit/sort/order/search/status
```
