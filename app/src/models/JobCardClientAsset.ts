import mongoose, { Schema, Document } from "mongoose";

export interface IJobCardClientAssetDocument extends Document {
  jobCardId: mongoose.Types.ObjectId;
  clientAssetId: mongoose.Types.ObjectId;
  completeChecklist?: number;
  completeChecklistDateTime?: Date;
  completeChecklistUserId?: mongoose.Types.ObjectId;
  dateTime?: Date;
  addedBy?: mongoose.Types.ObjectId;
  status?: number;
  detailsChanged?: number;
}

const JobCardClientAssetSchema = new Schema<IJobCardClientAssetDocument>(
  {
    jobCardId: { type: Schema.Types.ObjectId, ref: "JobCard", required: true },
    clientAssetId: { type: Schema.Types.ObjectId, ref: "ClientAsset", required: true },
    completeChecklist: { type: Number },
    completeChecklistDateTime: { type: Date },
    completeChecklistUserId: { type: Schema.Types.ObjectId, ref: "User" },
    dateTime: { type: Date },
    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: Number },
    detailsChanged: { type: Number },
  },
  { timestamps: true }
);

JobCardClientAssetSchema.index({ jobCardId: 1 });

export default mongoose.models.JobCardClientAsset || mongoose.model<IJobCardClientAssetDocument>("JobCardClientAsset", JobCardClientAssetSchema);
