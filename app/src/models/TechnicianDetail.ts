import mongoose, { Schema, Document } from "mongoose";

export interface ITechnicianDetailDocument extends Document {
  technicianId: mongoose.Types.ObjectId;
  notes?: string;
}

const TechnicianDetailSchema = new Schema<ITechnicianDetailDocument>(
  {
    technicianId: { type: Schema.Types.ObjectId, ref: "Technician", required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

TechnicianDetailSchema.index({ technicianId: 1 });

export default mongoose.models.TechnicianDetail || mongoose.model<ITechnicianDetailDocument>("TechnicianDetail", TechnicianDetailSchema);
