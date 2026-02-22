import mongoose, { Schema, Document } from "mongoose";

export interface ISupportTicketDocument extends Document {
  ticketNo: number;
  userId?: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  clientSiteId?: mongoose.Types.ObjectId;
  clientAssetId?: mongoose.Types.ObjectId;
  clientContactId?: mongoose.Types.ObjectId;
  titleId?: mongoose.Types.ObjectId;
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

const SupportTicketSchema = new Schema<ISupportTicketDocument>(
  {
    ticketNo: { type: Number, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    clientSiteId: { type: Schema.Types.ObjectId, ref: "ClientSite" },
    clientAssetId: { type: Schema.Types.ObjectId, ref: "ClientAsset" },
    clientContactId: { type: Schema.Types.ObjectId, ref: "ClientContact" },
    titleId: { type: Schema.Types.ObjectId, ref: "Title" },
    warranty: { type: Number },
    parts: { type: Number },
    productionImpact: { type: Number },
    timeIssueHours: { type: Number },
    timeIssueMinutes: { type: Number },
    timeIssueAmpm: { type: Number },
    ticketStatus: { type: Number, default: 1 },
    markComplete: { type: Number },
    invoiceNumber: { type: String },
    onSiteTechnicianRequired: { type: Number },
    dateTime: { type: Date },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

SupportTicketSchema.index({ ticketNo: 1 });
SupportTicketSchema.index({ clientId: 1 });
SupportTicketSchema.index({ ticketStatus: 1 });
SupportTicketSchema.index({ status: 1 });

export default mongoose.models.SupportTicket || mongoose.model<ISupportTicketDocument>("SupportTicket", SupportTicketSchema);
