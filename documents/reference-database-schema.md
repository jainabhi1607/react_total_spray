# Database Schema Reference

## Database

MongoDB via Mongoose 9.2.1. Connection singleton in `src/lib/db.ts` (cached global, `bufferCommands: false`).
Next.js config: `serverExternalPackages: ["mongoose"]` for serverless optimization.

## Models (58 files in `src/models/`)

### Core Business

| Model | Collection | Key Fields | References |
|-------|-----------|-----------|-----------|
| Client | clients | companyName, companyLogo, abn, address, singleSite, status | userId→User |
| ClientDetail | clientdetails | clientId, about | clientId→Client |
| ClientSite | clientsites | clientId (required), siteName, address, siteId, status | clientId→Client |
| ClientContact | clientcontacts | clientId (required), clientSiteId, name, lastName, email, phone, position | clientId→Client, clientSiteId→ClientSite |
| ClientAsset | clientassets | clientId (required), clientSiteId, machineName, serialNo, assetTypeId, assetMakeId, assetModelId, notes, publicCode (unique), status | clientId→Client, clientSiteId→ClientSite, assetMakeId→AssetMake, assetModelId→AssetModel |
| ClientNote | clientnotes | clientId (required), noteText, userId | clientId→Client, userId→User |
| ClientDocument | clientdocuments | clientId (required), docTitle, docPath, docType | clientId→Client |
| ClientEquipment | clientequipments | clientId, equipmentType, serialNumber | clientId→Client |
| ServiceAgreement | serviceagreements | clientId (required), title, agreementNumber, serviceType, frequency, coveredSiteIds[], status, contractValue | clientId→Client, coveredSiteIds[]→ClientSite |

### Assets & Maintenance

| Model | Collection | Key Fields | References |
|-------|-----------|-----------|-----------|
| AssetType | assettypes | title (required) | — |
| AssetMake | assetmakes | title (required) | — |
| AssetModel | assetmodels | title (required), assetTypeId | assetTypeId→AssetType |
| AssetMakeModel | assetmakemodels | assetMakeId, assetModelId | assetMakeId→AssetMake, assetModelId→AssetModel |
| AssetReminder | assetreminders | clientAssetId, reminderType, reminderDate | clientAssetId→ClientAsset |
| ClientAssetAttachment | clientassetattachments | clientAssetId (required), filePath | clientAssetId→ClientAsset |
| ClientAssetComment | clientassetcomments | clientAssetId (required), comment, userId | clientAssetId→ClientAsset, userId→User |
| ClientAssetLogMaintenance | clientassetlogmaintenances | clientAssetId (required), maintenanceDate | clientAssetId→ClientAsset |
| MaintenanceTask | maintenancetasks | title (required), description | — |

### Support Tickets

| Model | Collection | Key Fields | References |
|-------|-----------|-----------|-----------|
| SupportTicket | supporttickets | ticketNo (unique), clientId (required), clientSiteId, clientAssetId, clientContactId, ticketStatus, warranty, parts, productionImpact, invoiceNumber, status | clientId→Client, clientAssetId→ClientAsset, clientContactId→ClientContact, titleId→Title |
| SupportTicketDetail | supportticketdetails | supportTicketId (required), description, supportingEvidence1-3, rootCause, resolution, resolvedDate | supportTicketId→SupportTicket |
| SupportTicketComment | supportticketcomments | supportTicketId (required), comment, userId | supportTicketId→SupportTicket, userId→User |
| SupportTicketLog | supportticketlogs | supportTicketId (required), actionType, userId | supportTicketId→SupportTicket, userId→User |
| SupportTicketOwner | supportticketowners | supportTicketId, userId | supportTicketId→SupportTicket, userId→User |
| SupportTicketTechnician | supporttickettechnicians | supportTicketId, userId, assignedDate | supportTicketId→SupportTicket, userId→User |
| SupportTicketTime | supporttickettimes | supportTicketId (required), timeSpent, userId | supportTicketId→SupportTicket, userId→User |
| SupportTicketAttachment | supportticketattachments | supportTicketId (required), filePath | supportTicketId→SupportTicket |

### Job Cards

| Model | Collection | Key Fields | References |
|-------|-----------|-----------|-----------|
| JobCard | jobcards | uniqueId (required, unique), userId (required), clientId (required), clientAssetId, supportTicketId, ticketNo, jobCardStatus, multiDayJob, jobDate, jobCardType, status, recurringJob, nextRecurringDate | userId→User, clientId→Client, clientAssetId→ClientAsset, supportTicketId→SupportTicket |
| JobCardDetail | jobcarddetails | jobCardId (required) | jobCardId→JobCard |
| JobCardClientAsset | jobcardclientassets | jobCardId, clientAssetId | jobCardId→JobCard, clientAssetId→ClientAsset |
| JobCardTechnician | jobcardtechnicians | jobCardId, userId, technicianId, assignedDate | jobCardId→JobCard, technicianId→Technician |
| JobCardOwner | jobcardowners | jobCardId, userId | jobCardId→JobCard, userId→User |
| JobCardComment | jobcardcomments | jobCardId (required), comment, userId | jobCardId→JobCard, userId→User |
| JobCardLog | jobcardlogs | jobCardId (required), actionType, userId | jobCardId→JobCard, userId→User |
| JobCardAttachment | jobcardattachments | jobCardId (required), filePath, fileName | jobCardId→JobCard |
| JobCardType | jobcardtypes | title (required) | — |

### Checklists

| Model | Collection | Key Fields | References |
|-------|-----------|-----------|-----------|
| ChecklistTemplate | checklisttemplates | title (required), userId, adminId | userId→User, adminId→User |
| ChecklistTemplateItem | checklisttemplateitems | checklistTemplateId (required), itemText, displayOrder | checklistTemplateId→ChecklistTemplate |
| ChecklistTemplateTag | checklisttemplatetags | checklistTemplateId, tagId | checklistTemplateId→ChecklistTemplate, tagId→ChecklistTag |
| ChecklistTag | checklisttags | title (required) | — |
| JobCardAssetChecklistItem | jobcardassetchecklistitems | jobCardId, clientAssetId, checklistItemId, status | jobCardId→JobCard, clientAssetId→ClientAsset |
| JobCardAssetChecklistItemAttachment | jobcardassetchecklistitemattachments | jobCardAssetChecklistItemId, filePath | jobCardAssetChecklistItemId→JobCardAssetChecklistItem |

### Technicians

| Model | Collection | Key Fields | References |
|-------|-----------|-----------|-----------|
| Technician | technicians | companyName (required), userId, parentId, licenceNumber, abn, email, phone, insuranceStatus, status | userId→User, parentId→Technician (sub-technician) |
| TechnicianDetail | techniciandetails | technicianId (required) | technicianId→Technician |
| TechnicianInsurance | technicianinsurances | technicianId (required), insuranceType, expiryDate, certPath | technicianId→Technician |
| TechnicianTag | techniciantags | technicianId, tagId | technicianId→Technician, tagId→Tag |

### Users & Auth

| Model | Collection | Key Fields | References |
|-------|-----------|-----------|-----------|
| User | users | email (unique), password, name, lastName, role, status, phone, position | adminId→User, clientId→Client |
| UserDetail | userdetails | userId (required, unique), profilePic, twoFactorAuth, resetToken, invitationExpiryDate | userId→User |
| UserGroup | usergroups | userId (required), title, defaultGroup | userId→User |
| UserGroupUser | usergroupusers | userGroupId, userId | userGroupId→UserGroup, userId→User |
| UserGroupClientSite | usergroupclientsites | userGroupId, clientSiteId | userGroupId→UserGroup, clientSiteId→ClientSite |
| UserGroupClientAsset | usergroupclientassets | userGroupId, clientAssetId | userGroupId→UserGroup, clientAssetId→ClientAsset |
| UserLoginCode | userlogincodes | userId (required), code, expiryDate | userId→User |
| UserLoginIpAddress | userloginipaddresses | userId (required), ipAddress, loginResponse, dateTime | userId→User |

### Settings & System

| Model | Collection | Key Fields | References |
|-------|-----------|-----------|-----------|
| Tag | tags | title (required) | — |
| Title | titles | title (required) | — |
| Resource | resources | resourceName (required), resourceCategoryId, thumbnail, resourceFile, status | resourceCategoryId→ResourceCategory |
| ResourceCategory | resourcecategories | title (required) | — |
| GlobalSetting | globalsettings | newSignupEmailSubject, passwordRecoveryEmailContent, sendgridApikey, postmarkApikey, awsBucket, stripeApikey | — |
| ActionLog | actionlogs | adminId, userId, tasks, actionType, dateTime | adminId→User, userId→User |

## Key Relationships

- **Client → Sites → Assets**: Client._id → ClientSite.clientId → ClientAsset.clientSiteId
- **Client → Contacts**: ClientContact.clientId + optional clientSiteId
- **Asset hierarchy**: AssetType → AssetModel.assetTypeId; AssetMake + AssetModel linked via AssetMakeModel
- **Support Ticket**: References clientId, clientSiteId, clientAssetId, clientContactId
- **Job Card → Assets**: Via JobCardClientAsset junction table
- **Job Card → Technicians**: Via JobCardTechnician junction table
- **Job Card → Support Ticket**: JobCard.supportTicketId
- **Technician sub-technicians**: Technician.parentId → Technician (self-reference)
- **Service Agreement → Sites**: coveredSiteIds[] array of ClientSite refs
- **User Groups**: Control site/asset access via UserGroupClientSite and UserGroupClientAsset
- **User → Client**: User.clientId links client portal users to their client

## Indexes

- **User**: `email` (unique), `name+lastName`
- **Client**: `companyName`, `status`
- **ClientSite**: `clientId`
- **ClientAsset**: `clientId`, `clientSiteId`, `publicCode` (unique)
- **SupportTicket**: `ticketNo` (unique), `clientId`, `ticketStatus`, `status`
- **JobCard**: `uniqueId` (unique), `ticketNo`, `clientId`, `jobCardStatus`, `status`
- **Technician**: `userId`
- Foreign key fields generally indexed on referencing models

## Important Notes

- All models use ObjectId references (Mongoose `ref` for populate)
- **Model must be imported in the API route file** for `.populate()` to work
- User status: `1` = active, `25` = invited/pending
- User roles: 1/2/3 = admin, 4/6 = client portal
- Ticket numbers auto-increment starting from 10000
- ClientAsset.publicCode is unique — used for public QR code links
- JobCard.uniqueId is unique — used for public job card links
