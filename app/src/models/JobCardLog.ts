import mongoose, { Schema, Document } from "mongoose";

export interface IJobCardLogDocument extends Document {
  jobCardId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  task?: string;
  dateTime?: Date;
}

const JobCardLogSchema = new Schema<IJobCardLogDocument>(
  {
    jobCardId: { type: Schema.Types.ObjectId, ref: "JobCard" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    task: { type: String },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

JobCardLogSchema.index({ jobCardId: 1 });

export default mongoose.models.JobCardLog || mongoose.model<IJobCardLogDocument>("JobCardLog", JobCardLogSchema);
