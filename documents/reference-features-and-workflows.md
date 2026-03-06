# Features & Workflows Reference

## Authentication

- **Provider**: NextAuth 5 beta with credentials provider
- **Password**: bcryptjs hashing, compared on login
- **Login flow**: Email/password → OTP verification → Dashboard
- **Password reset**: Forgot password → email token → reset page
- **User invitation**: Admin creates user → invite email → accept invite page
- **Login logging**: All attempts (success/failed) logged with IP address in `UserLoginIpAddress`
- **User status**: `1` = active, `25` = invited/pending
- **Route protection**: `proxy.ts` middleware — whitelist for public paths, role-based for admin routes

## User Roles & Access

| Role | Value | Access Level |
|------|-------|-------------|
| Super Admin | 1 | Full access to all admin features |
| Admin | 2 | Full access to all admin features |
| Manager | 3 | Full access to all admin features |
| Client User | 4 | Limited: dashboard, clients, job-cards, support-tickets, assets, contacts, resources, settings |
| Client Admin | 6 | Same as Client User |

- Client portal users (roles 4/6) are linked to a client via `User.clientId`
- Access control enforced in `proxy.ts` middleware and API routes via `requireAuth()`/`requireAdmin()`

## Client Management

### Clients
- Company name, ABN, address, status
- Detail page with tabs: Overview, Service Agreements, Work History, Sites, Contacts, Assets, Portal Users
- Add/edit via `AddClientDialog` (supports single site creation on add)

### Sites
- Physical locations belonging to a client
- Name, address fields
- Add/edit via `AddSiteDialog` (standalone or embedded with `clientId`)

### Contacts
- People associated with a client, optionally linked to a site
- Fields: name, lastName, position, email, phone, clientSiteId
- Used as requesters on support tickets

### Assets (Equipment)
- Machines/equipment at client sites
- Fields: machineName, serialNumber, assetType, make, model, clientSiteId
- Type/Make/Model hierarchy managed via AssetType, AssetMake, AssetModel, AssetMakeModel
- Detail page: Overview (notes, image, QR code, details), Maintenance (breakdown charts), Activity tabs
- Maintenance logging and reminders

## Support Tickets

### Lifecycle
```
New → In Progress → On Hold → Resolved → Closed
```

### Creation
- Required: clientId, description
- Optional: clientSiteId, clientAssetId, clientContactId
- ticketNo auto-generated starting from 10000

### Detail Page Features
- 2-column scrollable layout
- Status progress bar with inline status updates
- Inline field editing
- Time tracking with timer
- Comments with public/internal visibility toggle
- File attachments
- Technician assignment
- Owner assignment
- Linked job cards
- Ticket history / activity log

## Job Cards

- Work orders created for clients
- Link to client, site, and multiple assets
- Assign technicians
- Checklist system for asset inspections
- Comments, attachments, activity log
- Types managed via settings (JobCardType)

## Technicians

- External workers assigned to tickets and job cards
- Profile with tags (skills/specialties)
- Insurance document tracking
- Sub-technicians support
- Notes and archive functionality
- Detail page with tabs

## Checklists

- Reusable templates with items
- Tags for categorization
- Applied to assets within job cards
- Item-level attachments

## Resources

- Documents, guides, links organized by categories
- Category tabs with card grid layout
- Add/edit via dialog

## Settings

Managed via admin settings page:
- **Tags**: Categorization tags
- **Titles**: Name prefixes (Mr, Mrs, etc.)
- **Job Card Types**: Types of job cards
- **Resource Categories**: Resource organization
- **Asset Settings**: Asset types, makes, models
- **Email Notifications**: Email configuration
- **Checklist Templates**: Template management

## Public Portal Pages

Accessible without authentication:
- `/job-card` — View job card details
- `/client-asset` — View asset information
- `/support` — Submit support requests
- `/log-maintenance` — Log maintenance activities
- `/history` — View history

## Dashboard

- Stat cards (clients, tickets, job cards, etc.)
- Recent support tickets list
- Recent job cards list
- Status breakdowns
