import mongoose, { Schema, Document } from "mongoose";

export interface IJobCardTypeDocument extends Document {
  title: string;
  dateTime?: Date;
}

const JobCardTypeSchema = new Schema<IJobCardTypeDocument>(
  {
    title: { type: String, required: true },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.JobCardType || mongoose.model<IJobCardTypeDocument>("JobCardType", JobCardTypeSchema);
