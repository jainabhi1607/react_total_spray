import mongoose, { Schema, Document } from "mongoose";

export interface IJobCardDetailDocument extends Document {
  jobCardId: mongoose.Types.ObjectId;
  description?: string;
  technicianBriefing?: string;
  contractApprove?: number;
}

const JobCardDetailSchema = new Schema<IJobCardDetailDocument>(
  {
    jobCardId: { type: Schema.Types.ObjectId, ref: "JobCard", required: true },
    description: { type: String },
    technicianBriefing: { type: String },
    contractApprove: { type: Number },
  },
  { timestamps: true }
);

JobCardDetailSchema.index({ jobCardId: 1 });

export default mongoose.models.JobCardDetail || mongoose.model<IJobCardDetailDocument>("JobCardDetail", JobCardDetailSchema);
