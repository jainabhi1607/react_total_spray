import { Types } from "mongoose";

// Base document interface
export interface BaseDocument {
  _id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// User interfaces
export interface IUser extends BaseDocument {
  adminId?: Types.ObjectId;
  clientId?: Types.ObjectId;
  username?: string;
  password: string;
  name: string;
  lastName?: string;
  email: string;
  phone?: string;
  position?: string;
  role: number;
  status: number;
}

export interface IUserDetail extends BaseDocument {
  userId: Types.ObjectId;
  profilePic?: string;
  customFields?: string;
  twoFactorAuth?: number;
  resetToken?: string;
  invitationExpiryDate?: Date;
  authcode?: string;
  dateTime?: Date;
}

export interface IUserLoginCode extends BaseDocument {
  userId: Types.ObjectId;
  otp: number;
  expiryTime: Date;
  status: number;
}

export interface IUserLoginIpAddress extends BaseDocument {
  userId: Types.ObjectId;
  ipAddress?: string;
  city?: string;
  dateTime?: Date;
  loginResponse?: string;
}

// Client interfaces
export interface IClient extends BaseDocument {
  companyName: string;
  companyLogo?: string;
  userId?: Types.ObjectId;
  address?: string;
  abn?: string;
  singleSite?: number;
  accessToken?: string;
  dateTime?: Date;
  status: number;
}

export interface IClientDetail extends BaseDocument {
  clientId: Types.ObjectId;
  about?: string;
}

export interface IClientSite extends BaseDocument {
  clientId: Types.ObjectId;
  siteName: string;
  address?: string;
  siteId?: string;
  dateTime?: Date;
  status: number;
}

export interface IClientAsset extends BaseDocument {
  clientId: Types.ObjectId;
  clientSiteId: Types.ObjectId;
  machineName: string;
  serialNo?: string;
  assetTypeId?: string;
  assetMakeId?: Types.ObjectId;
  assetModelId?: Types.ObjectId;
  image?: string;
  notes?: string;
  notesEditDateTime?: Date;
  dateTime?: Date;
  status: number;
}

export interface IClientContact extends BaseDocument {
  clientId: Types.ObjectId;
  clientSiteId?: Types.ObjectId;
  userId?: Types.ObjectId;
  name: string;
  lastName?: string;
  position?: string;
  email?: string;
  phone?: string;
  dateTime?: Date;
}

export interface IClientNote extends BaseDocument {
  clientId: Types.ObjectId;
  notes: string;
  noteType?: number;
  userId: Types.ObjectId;
  dateTime?: Date;
}

export interface IClientDocument extends BaseDocument {
  clientId: Types.ObjectId;
  userId: Types.ObjectId;
  documentName: string;
  fileName: string;
  fileSize?: string;
  documentCounter?: number;
  dateTime?: Date;
}

export interface IClientAssetAttachment extends BaseDocument {
  clientAssetId: Types.ObjectId;
  userId: Types.ObjectId;
  dateTime?: Date;
  documentName?: string;
  fileName?: string;
  fileSize?: number;
}

export interface IClientAssetComment extends BaseDocument {
  clientAssetId: Types.ObjectId;
  comments: string;
  commentType?: number;
  userId: Types.ObjectId;
  dateTime?: Date;
}

export interface IClientAssetLogMaintenance extends BaseDocument {
  clientAssetId: Types.ObjectId;
  task?: string;
  taskName?: string;
  notes?: string;
  taskDate?: Date;
  dateTime?: Date;
}

export interface IClientEquipment extends BaseDocument {
  clientId: Types.ObjectId;
  clientSiteId: Types.ObjectId;
  machineName: string;
  serialNo?: string;
  equipmentDate?: Date;
  equipmentType?: string;
  dateTime?: Date;
  status: number;
}

// Support Ticket interfaces
export interface ISupportTicket extends BaseDocument {
  ticketNo: number;
  userId?: Types.ObjectId;
  clientId: Types.ObjectId;
  clientSiteId?: Types.ObjectId;
  clientAssetId?: Types.ObjectId;
  clientContactId?: Types.ObjectId;
  titleId?: Types.ObjectId;
  warranty?: number;
  parts?: number;
  productionImpact?: number;
  timeIssueHours?: number;
  timeIssueMinutes?: number;
  timeIssueAmpm?: number;
  ticketStatus: number;
  markComplete?: number;
  invoiceNumber?: string;
  onSiteTechnicianRequired?: number;
  dateTime?: Date;
  status: number;
}

export interface ISupportTicketDetail extends BaseDocument {
  supportTicketId: Types.ObjectId;
  description?: string;
  supportingEvidence1?: string;
  supportingEvidence2?: string;
  supportingEvidence3?: string;
  supportingEvidenceSize1?: string;
  supportingEvidenceSize2?: string;
  supportingEvidenceSize3?: string;
  supportingEvidenceName1?: string;
  supportingEvidenceName2?: string;
  supportingEvidenceName3?: string;
  resolvedComments?: string;
  resolvedDate?: Date;
  rootCause?: string;
  rootCauseUserId?: Types.ObjectId;
  rootCauseDateTime?: Date;
  resolution?: string;
  resolutionUserId?: Types.ObjectId;
  resolutionDateTime?: Date;
}

export interface ISupportTicketComment extends BaseDocument {
  supportTicketId: Types.ObjectId;
  comments: string;
  commentType?: number;
  userId: Types.ObjectId;
  dateTime?: Date;
  visibility?: number;
}

export interface ISupportTicketAttachment extends BaseDocument {
  supportTicketId: Types.ObjectId;
  userId?: Types.ObjectId;
  dateTime?: Date;
  documentName?: string;
  fileName?: string;
  fileSize?: number;
  visibility?: number;
}

export interface ISupportTicketLog extends BaseDocument {
  supportTicketId: Types.ObjectId;
  userId: Types.ObjectId;
  task: string;
  dateTime?: Date;
}

export interface ISupportTicketOwner extends BaseDocument {
  supportTicketId: Types.ObjectId;
  userId: Types.ObjectId;
  dateTime?: Date;
  addedBy?: Types.ObjectId;
}

export interface ISupportTicketTechnician extends BaseDocument {
  supportTicketId: Types.ObjectId;
  technicianId: Types.ObjectId;
  onSite?: number;
  dateTime?: Date;
  addedBy?: Types.ObjectId;
}

export interface ISupportTicketTime extends BaseDocument {
  supportTicketId: Types.ObjectId;
  userId: Types.ObjectId;
  timeHours: number;
  timeMinutes: number;
  timeDate?: Date;
  description?: string;
  timeType?: number;
  dateTime?: Date;
}

// Job Card interfaces
export interface IJobCard extends BaseDocument {
  parentId?: Types.ObjectId;
  tempParentId?: Types.ObjectId;
  ticketNo?: number;
  userId: Types.ObjectId;
  clientId: Types.ObjectId;
  clientSiteId?: Types.ObjectId;
  clientAssetId?: Types.ObjectId;
  clientContactId?: Types.ObjectId;
  jobCardStatus?: number;
  markComplete?: number;
  invoiceNumber?: string;
  warranty?: number;
  uniqueId: string;
  jobCardSendDate?: Date;
  dateTime?: Date;
  status: number;
  multiDayJob?: number;
  jobDate?: Date;
  jobEndDate?: Date;
  jobCardType?: number;
  supportTicketId?: Types.ObjectId;
  recurringJob?: number;
  recurringPeriod?: number;
  recurringRange?: number;
  nextRecurringDate?: Date;
  startDate?: Date;
  titleId?: Types.ObjectId;
  freshRecurringJob?: number;
  contractApprove?: number;
  skipStartDateInRecurring?: number;
}

export interface IJobCardDetail extends BaseDocument {
  jobCardId: Types.ObjectId;
  description?: string;
  technicianBriefing?: string;
  contractApprove?: number;
}

export interface IJobCardClientAsset extends BaseDocument {
  jobCardId: Types.ObjectId;
  clientAssetId: Types.ObjectId;
  completeChecklist?: number;
  completeChecklistDateTime?: Date;
  completeChecklistUserId?: Types.ObjectId;
  dateTime?: Date;
  addedBy?: Types.ObjectId;
  status?: number;
  detailsChanged?: number;
}

export interface IJobCardComment extends BaseDocument {
  jobCardId: Types.ObjectId;
  comments: string;
  commentType?: number;
  userId: Types.ObjectId;
  dateTime?: Date;
  visibility?: number;
}

export interface IJobCardAttachment extends BaseDocument {
  jobCardId: Types.ObjectId;
  userId: Types.ObjectId;
  dateTime?: Date;
  documentName?: string;
  fileName?: string;
  fileSize?: number;
  visibility?: number;
}

export interface IJobCardLog extends BaseDocument {
  jobCardId: Types.ObjectId;
  userId: Types.ObjectId;
  task: string;
  dateTime?: Date;
}

export interface IJobCardOwner extends BaseDocument {
  jobCardId: Types.ObjectId;
  userId: Types.ObjectId;
  dateTime?: Date;
  addedBy?: Types.ObjectId;
}

export interface IJobCardTechnician extends BaseDocument {
  jobCardId: Types.ObjectId;
  technicianId: Types.ObjectId;
  dateTime?: Date;
  addedBy?: Types.ObjectId;
}

export interface IJobCardType extends BaseDocument {
  title: string;
  dateTime?: Date;
}

export interface IJobCardAssetChecklistItem extends BaseDocument {
  jobCardClientAssetId: Types.ObjectId;
  userId?: Types.ObjectId;
  details: string;
  checklistItemType: number;
  makeResponseMandatory?: number;
  fileName?: string;
  fileSize?: string;
  fileRealName?: string;
  orderNo?: number;
  responseType1?: number;
  responseType2?: number;
  comments?: string;
  responseType7?: number;
  responseType10?: number;
  markAsDone?: number;
  signature?: string;
  signatureDateTime?: Date;
  setDateTime?: Date;
  noResponse?: string;
  noResponseText?: string;
  detailsChanged?: number;
  imageChanged?: number;
}

export interface IJobCardAssetChecklistItemAttachment extends BaseDocument {
  jobCardAssetChecklistItemId: Types.ObjectId;
  userId: Types.ObjectId;
  documentName?: string;
  fileName?: string;
  fileSize?: number;
  dateTime?: Date;
  visibility?: number;
}

// Checklist interfaces
export interface IChecklistTemplate extends BaseDocument {
  userId: Types.ObjectId;
  adminId?: Types.ObjectId;
  title: string;
  dateTime?: Date;
}

export interface IChecklistTemplateItem extends BaseDocument {
  checklistTemplateId: Types.ObjectId;
  details: string;
  checklistItemType: number;
  makeResponseMandatory?: number;
  fileName?: string;
  fileSize?: string;
  fileRealName?: string;
  orderNo?: number;
}

export interface IChecklistTag extends BaseDocument {
  title: string;
  dateTime?: Date;
}

export interface IChecklistTemplateTag extends BaseDocument {
  checklistTemplateId: Types.ObjectId;
  checklistTagId: Types.ObjectId;
  dateTime?: Date;
}

// Technician interfaces
export interface ITechnician extends BaseDocument {
  userId?: Types.ObjectId;
  parentId?: Types.ObjectId;
  companyName: string;
  licenceNumber?: string;
  licenceExpiry?: Date;
  abn?: string;
  email?: string;
  phone?: string;
  address?: string;
  insuranceStatus?: number;
  status?: number;
}

export interface ITechnicianDetail extends BaseDocument {
  technicianId: Types.ObjectId;
  notes?: string;
}

export interface ITechnicianInsurance extends BaseDocument {
  addedBy: Types.ObjectId;
  groupNumber?: number;
  technicianId: Types.ObjectId;
  lastReference?: number;
  insurancePolicyType?: number;
  expiryDate?: Date;
  fileName?: string;
  fileSize?: string;
  quoteSentToCustomer?: number;
  status?: number;
  dateTime?: Date;
}

export interface ITechnicianTag extends BaseDocument {
  tagId: Types.ObjectId;
  technicianId: Types.ObjectId;
  dateTime?: Date;
}

// Settings/config interfaces
export interface ITag extends BaseDocument {
  title: string;
  dateTime?: Date;
}

export interface ITitle extends BaseDocument {
  title: string;
  dateTime?: Date;
}

export interface IAssetMake extends BaseDocument {
  title: string;
  dateTime?: Date;
}

export interface IAssetModel extends BaseDocument {
  title: string;
  assetTypeId?: Types.ObjectId;
  dateTime?: Date;
}

export interface IAssetType extends BaseDocument {
  title: string;
  dateTime?: Date;
}

export interface IAssetMakeModel extends BaseDocument {
  assetMakeId: Types.ObjectId;
  assetModelId: Types.ObjectId;
  dateTime?: Date;
}

export interface IAssetReminder extends BaseDocument {
  clientAssetId: Types.ObjectId;
  userId: Types.ObjectId;
  reminder: string;
  remindDate?: Date;
  status?: number;
  dateTime?: Date;
}

export interface IResource extends BaseDocument {
  resourceCategoryId: Types.ObjectId;
  resourceName: string;
  thumbnail?: string;
  resourceFile?: string;
  dateTime?: Date;
  status?: number;
}

export interface IResourceCategory extends BaseDocument {
  title: string;
  dateTime?: Date;
}

export interface IMaintenanceTask extends BaseDocument {
  clientId: Types.ObjectId;
  title: string;
  dateTime?: Date;
}

export interface IGlobalSetting extends BaseDocument {
  newSignupEmailSubject?: string;
  newSignupEmailContent?: string;
  passwordRecoveryEmailSubject?: string;
  passwordRecoveryEmailContent?: string;
  sendgridApikey?: string;
  postmarkApikey?: string;
  googleApikey?: string;
  awsBucket?: string;
  awsAccountId?: string;
  awsAccessKeyId?: string;
  awsAccessKeySecret?: string;
  stripeApikey?: string;
  stripePublishKey?: string;
  technicianInvalidInsuranceNotificationEmails?: string;
  supportTicketAlertRecipients?: string;
}

export interface IActionLog extends BaseDocument {
  adminId?: Types.ObjectId;
  userId?: Types.ObjectId;
  tasks?: string;
  actionType?: number;
  dateTime?: Date;
}

// User Group interfaces
export interface IUserGroup extends BaseDocument {
  userId: Types.ObjectId;
  title: string;
  menus?: string;
  sites?: string;
  assets?: string;
  users?: string;
  defaultGroup?: number;
  dateTime?: Date;
}

export interface IUserGroupUser extends BaseDocument {
  userGroupId: Types.ObjectId;
  userId: Types.ObjectId;
}

export interface IUserGroupClientSite extends BaseDocument {
  userGroupId: Types.ObjectId;
  clientSiteId: Types.ObjectId;
}

export interface IUserGroupClientAsset extends BaseDocument {
  userGroupId: Types.ObjectId;
  userGroupSiteId?: Types.ObjectId;
  clientAssetId: Types.ObjectId;
}

// Session/Auth types
export interface SessionUser {
  id: string;
  name: string;
  lastName?: string;
  email: string;
  role: number;
  clientId?: string;
  image?: string;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Search params
export interface SearchParams {
  q?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  status?: number;
}
