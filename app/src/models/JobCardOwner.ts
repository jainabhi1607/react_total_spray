import mongoose, { Schema, Document } from "mongoose";

export interface IJobCardOwnerDocument extends Document {
  jobCardId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  dateTime?: Date;
  addedBy?: mongoose.Types.ObjectId;
}

const JobCardOwnerSchema = new Schema<IJobCardOwnerDocument>(
  {
    jobCardId: { type: Schema.Types.ObjectId, ref: "JobCard", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dateTime: { type: Date },
    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

JobCardOwnerSchema.index({ jobCardId: 1 });

export default mongoose.models.JobCardOwner || mongoose.model<IJobCardOwnerDocument>("JobCardOwner", JobCardOwnerSchema);
