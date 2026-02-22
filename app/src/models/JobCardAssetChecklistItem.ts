import mongoose, { Schema, Document } from "mongoose";

export interface IJobCardAssetChecklistItemDocument extends Document {
  jobCardClientAssetId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  details?: string;
  checklistItemType?: number;
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

const JobCardAssetChecklistItemSchema = new Schema<IJobCardAssetChecklistItemDocument>(
  {
    jobCardClientAssetId: { type: Schema.Types.ObjectId, ref: "JobCardClientAsset" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    details: { type: String },
    checklistItemType: { type: Number },
    makeResponseMandatory: { type: Number },
    fileName: { type: String },
    fileSize: { type: String },
    fileRealName: { type: String },
    orderNo: { type: Number },
    responseType1: { type: Number },
    responseType2: { type: Number },
    comments: { type: String },
    responseType7: { type: Number },
    responseType10: { type: Number },
    markAsDone: { type: Number },
    signature: { type: String },
    signatureDateTime: { type: Date },
    setDateTime: { type: Date },
    noResponse: { type: String },
    noResponseText: { type: String },
    detailsChanged: { type: Number },
    imageChanged: { type: Number },
  },
  { timestamps: true }
);

JobCardAssetChecklistItemSchema.index({ jobCardClientAssetId: 1 });

export default mongoose.models.JobCardAssetChecklistItem || mongoose.model<IJobCardAssetChecklistItemDocument>("JobCardAssetChecklistItem", JobCardAssetChecklistItemSchema);
