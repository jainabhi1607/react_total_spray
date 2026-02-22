import mongoose, { Schema, Document } from "mongoose";

export interface IJobCardCommentDocument extends Document {
  jobCardId?: mongoose.Types.ObjectId;
  comments?: string;
  commentType?: number;
  userId?: mongoose.Types.ObjectId;
  dateTime?: Date;
  visibility?: number;
}

const JobCardCommentSchema = new Schema<IJobCardCommentDocument>(
  {
    jobCardId: { type: Schema.Types.ObjectId, ref: "JobCard" },
    comments: { type: String },
    commentType: { type: Number },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    dateTime: { type: Date },
    visibility: { type: Number },
  },
  { timestamps: true }
);

JobCardCommentSchema.index({ jobCardId: 1 });

export default mongoose.models.JobCardComment || mongoose.model<IJobCardCommentDocument>("JobCardComment", JobCardCommentSchema);
