import mongoose, { Schema, Document } from "mongoose";

export interface ISupportTicketAttachmentDocument extends Document {
  supportTicketId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  dateTime?: Date;
  documentName?: string;
  fileName?: string;
  fileSize?: number;
  visibility?: number;
}

const SupportTicketAttachmentSchema = new Schema<ISupportTicketAttachmentDocument>(
  {
    supportTicketId: { type: Schema.Types.ObjectId, ref: "SupportTicket" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    dateTime: { type: Date },
    documentName: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    visibility: { type: Number },
  },
  { timestamps: true }
);

SupportTicketAttachmentSchema.index({ supportTicketId: 1 });

export default mongoose.models.SupportTicketAttachment || mongoose.model<ISupportTicketAttachmentDocument>("SupportTicketAttachment", SupportTicketAttachmentSchema);
