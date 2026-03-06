# Implementation Progress

**Last Updated:** 6 March 2026

## Current Status

Active development of TSC admin dashboard. Core features implemented, ongoing enhancements.

## Completed Work

### Layout & Theming
- Dark header, cyan sidebar, global `rounded-[10px]`, active tab `#00AEEF`

### Settings Module
- Tags, Titles, Job Card Types, Resource Categories, Email Notifications, Asset Settings, Checklist Templates

### Dashboard
- Stat cards, recent tickets/job cards, status breakdowns

### Clients
- Listing page + detail view
- Detail tabs: Overview, Service Agreements, Work History, Sites, Contacts, Assets, Portal Users
- AddClientDialog with add/edit support

### Support Tickets
- Listing with stat cards (circle color matches count color), tab filters, inline edit/arrow icons
- Detail page (`/support-tickets/[id]`): 2-column scrollable layout, status progress bar, inline editing, timer, job cards, ticket history, comments with visibility toggle
- AddSupportTicketDialog with searchable client dropdown, cascading dropdowns, new requester mode

### Assets
- Listing with client/site filters (searchable client dropdown, sorted alphabetically)
- Table: Machine Name, Serial Number, Client Name, Client Site, Last Ticket, View Asset
- Detail page (`/assets/[id]`): Overview/Maintenance/Activity tabs, stat cards, notes editing, image placeholder, serial/date/make/model details, QR code section, maintenance breakdown chart
- AddAssetDialog with Type/Make/Model 3-column selector

### Technicians
- Listing page, view page with tabs
- Tags, notes, sub-technicians, insurance, archive

### Resources
- Category tabs, card grid, add/edit dialog

### Reusable Dialogs
- AddClientDialog, AddSiteDialog, AddAssetDialog, AddSupportTicketDialog
- InsuranceDialog, ResourceDialog, TechnicianDialog

### APIs
- Full CRUD for clients, sites, contacts, assets, support tickets, job cards, technicians, checklists, resources, users
- Dashboard stats, global search, file upload
- Auth: login, OTP, password reset, user invitation
