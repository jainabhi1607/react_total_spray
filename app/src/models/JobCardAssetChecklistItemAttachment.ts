import mongoose, { Schema, Document } from "mongoose";

export interface IJobCardAssetChecklistItemAttachmentDocument extends Document {
  jobCardAssetChecklistItemId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  documentName?: string;
  fileName?: string;
  fileSize?: number;
  dateTime?: Date;
  visibility?: number;
}

const JobCardAssetChecklistItemAttachmentSchema = new Schema<IJobCardAssetChecklistItemAttachmentDocument>(
  {
    jobCardAssetChecklistItemId: { type: Schema.Types.ObjectId, ref: "JobCardAssetChecklistItem" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    documentName: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    dateTime: { type: Date },
    visibility: { type: Number },
  },
  { timestamps: true }
);

JobCardAssetChecklistItemAttachmentSchema.index({ jobCardAssetChecklistItemId: 1 });

export default mongoose.models.JobCardAssetChecklistItemAttachment || mongoose.model<IJobCardAssetChecklistItemAttachmentDocument>("JobCardAssetChecklistItemAttachment", JobCardAssetChecklistItemAttachmentSchema);
