import mongoose, { Schema, Document } from "mongoose";

export interface ITechnicianInsuranceDocument extends Document {
  addedBy?: mongoose.Types.ObjectId;
  groupNumber?: number;
  technicianId: mongoose.Types.ObjectId;
  lastReference?: number;
  insurancePolicyType?: number;
  expiryDate?: Date;
  fileName?: string;
  fileSize?: string;
  quoteSentToCustomer?: number;
  status?: number;
  dateTime?: Date;
}

const TechnicianInsuranceSchema = new Schema<ITechnicianInsuranceDocument>(
  {
    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
    groupNumber: { type: Number },
    technicianId: { type: Schema.Types.ObjectId, ref: "Technician", required: true },
    lastReference: { type: Number },
    insurancePolicyType: { type: Number },
    expiryDate: { type: Date },
    fileName: { type: String },
    fileSize: { type: String },
    quoteSentToCustomer: { type: Number },
    status: { type: Number },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

TechnicianInsuranceSchema.index({ technicianId: 1 });

export default mongoose.models.TechnicianInsurance || mongoose.model<ITechnicianInsuranceDocument>("TechnicianInsurance", TechnicianInsuranceSchema);
