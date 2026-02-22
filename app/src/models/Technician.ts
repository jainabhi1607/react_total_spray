import mongoose, { Schema, Document } from "mongoose";

export interface ITechnicianDocument extends Document {
  userId?: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId;
  companyName: string;
  licenceNumber?: string;
  licenceExpiry?: Date;
  abn?: string;
  email?: string;
  phone?: string;
  address?: string;
  insuranceStatus?: number;
  status?: number;
}

const TechnicianSchema = new Schema<ITechnicianDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    parentId: { type: Schema.Types.ObjectId, ref: "Technician" },
    companyName: { type: String, required: true },
    licenceNumber: { type: String },
    licenceExpiry: { type: Date },
    abn: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    insuranceStatus: { type: Number },
    status: { type: Number },
  },
  { timestamps: true }
);

TechnicianSchema.index({ userId: 1 });

export default mongoose.models.Technician || mongoose.model<ITechnicianDocument>("Technician", TechnicianSchema);
