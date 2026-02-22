import mongoose, { Schema, Document } from "mongoose";

export interface IJobCardTechnicianDocument extends Document {
  jobCardId: mongoose.Types.ObjectId;
  technicianId: mongoose.Types.ObjectId;
  dateTime?: Date;
  addedBy?: mongoose.Types.ObjectId;
}

const JobCardTechnicianSchema = new Schema<IJobCardTechnicianDocument>(
  {
    jobCardId: { type: Schema.Types.ObjectId, ref: "JobCard", required: true },
    technicianId: { type: Schema.Types.ObjectId, ref: "Technician", required: true },
    dateTime: { type: Date },
    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

JobCardTechnicianSchema.index({ jobCardId: 1 });

export default mongoose.models.JobCardTechnician || mongoose.model<IJobCardTechnicianDocument>("JobCardTechnician", JobCardTechnicianSchema);
