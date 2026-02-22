import mongoose, { Schema, Document } from "mongoose";

export interface ITechnicianTagDocument extends Document {
  tagId: mongoose.Types.ObjectId;
  technicianId: mongoose.Types.ObjectId;
  dateTime?: Date;
}

const TechnicianTagSchema = new Schema<ITechnicianTagDocument>(
  {
    tagId: { type: Schema.Types.ObjectId, ref: "Tag", required: true },
    technicianId: { type: Schema.Types.ObjectId, ref: "Technician", required: true },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

TechnicianTagSchema.index({ technicianId: 1 });

export default mongoose.models.TechnicianTag || mongoose.model<ITechnicianTagDocument>("TechnicianTag", TechnicianTagSchema);
