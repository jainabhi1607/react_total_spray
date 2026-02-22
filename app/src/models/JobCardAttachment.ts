import mongoose, { Schema, Document } from "mongoose";

export interface IJobCardAttachmentDocument extends Document {
  jobCardId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  dateTime?: Date;
  documentName?: string;
  fileName?: string;
  fileSize?: number;
  visibility?: number;
}

const JobCardAttachmentSchema = new Schema<IJobCardAttachmentDocument>(
  {
    jobCardId: { type: Schema.Types.ObjectId, ref: "JobCard" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    dateTime: { type: Date },
    documentName: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    visibility: { type: Number },
  },
  { timestamps: true }
);

JobCardAttachmentSchema.index({ jobCardId: 1 });

export default mongoose.models.JobCardAttachment || mongoose.model<IJobCardAttachmentDocument>("JobCardAttachment", JobCardAttachmentSchema);
