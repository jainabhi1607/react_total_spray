import mongoose, { Schema, Document } from "mongoose";

export interface IJobCardDocument extends Document {
  parentId?: mongoose.Types.ObjectId;
  tempParentId?: mongoose.Types.ObjectId;
  ticketNo?: number;
  userId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  clientSiteId?: mongoose.Types.ObjectId;
  clientAssetId?: mongoose.Types.ObjectId;
  clientContactId?: mongoose.Types.ObjectId;
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
  supportTicketId?: mongoose.Types.ObjectId;
  recurringJob?: number;
  recurringPeriod?: number;
  recurringRange?: number;
  nextRecurringDate?: Date;
  startDate?: Date;
  titleId?: mongoose.Types.ObjectId;
  freshRecurringJob?: number;
  contractApprove?: number;
  skipStartDateInRecurring?: number;
}

const JobCardSchema = new Schema<IJobCardDocument>(
  {
    parentId: { type: Schema.Types.ObjectId, ref: "JobCard" },
    tempParentId: { type: Schema.Types.ObjectId, ref: "JobCard" },
    ticketNo: { type: Number },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    clientSiteId: { type: Schema.Types.ObjectId, ref: "ClientSite" },
    clientAssetId: { type: Schema.Types.ObjectId, ref: "ClientAsset" },
    clientContactId: { type: Schema.Types.ObjectId, ref: "ClientContact" },
    jobCardStatus: { type: Number },
    markComplete: { type: Number },
    invoiceNumber: { type: String },
    warranty: { type: Number },
    uniqueId: { type: String, required: true, unique: true },
    jobCardSendDate: { type: Date },
    dateTime: { type: Date },
    status: { type: Number, default: 1 },
    multiDayJob: { type: Number },
    jobDate: { type: Date },
    jobEndDate: { type: Date },
    jobCardType: { type: Number },
    supportTicketId: { type: Schema.Types.ObjectId, ref: "SupportTicket" },
    recurringJob: { type: Number },
    recurringPeriod: { type: Number },
    recurringRange: { type: Number },
    nextRecurringDate: { type: Date },
    startDate: { type: Date },
    titleId: { type: Schema.Types.ObjectId, ref: "Title" },
    freshRecurringJob: { type: Number },
    contractApprove: { type: Number },
    skipStartDateInRecurring: { type: Number },
  },
  { timestamps: true }
);

JobCardSchema.index({ ticketNo: 1 });
JobCardSchema.index({ uniqueId: 1 });
JobCardSchema.index({ clientId: 1 });
JobCardSchema.index({ jobCardStatus: 1 });
JobCardSchema.index({ status: 1 });

export default mongoose.models.JobCard || mongoose.model<IJobCardDocument>("JobCard", JobCardSchema);
