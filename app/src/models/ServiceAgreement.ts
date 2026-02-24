import mongoose, { Schema, Document } from "mongoose";

export interface IServiceAgreementDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  title: string;
  agreementNumber?: string;
  serviceType?: string;
  frequency?: number; // 1=Monthly, 2=Quarterly, 3=Annually
  startDate?: Date;
  endDate?: Date;
  status: number; // 1=Active, 2=Expired, 3=Draft
  coveredSiteIds: mongoose.Types.ObjectId[];
  contractValue?: number;
  billingFrequency?: string;
  notes?: string;
  document?: string;
  dateTime?: Date;
}

const ServiceAgreementSchema = new Schema<IServiceAgreementDocument>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    title: { type: String, required: true },
    agreementNumber: { type: String },
    serviceType: { type: String },
    frequency: { type: Number },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: Number, default: 3 },
    coveredSiteIds: [{ type: Schema.Types.ObjectId, ref: "ClientSite" }],
    contractValue: { type: Number },
    billingFrequency: { type: String },
    notes: { type: String },
    document: { type: String },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

ServiceAgreementSchema.index({ clientId: 1 });

export default mongoose.models.ServiceAgreement ||
  mongoose.model<IServiceAgreementDocument>("ServiceAgreement", ServiceAgreementSchema);
