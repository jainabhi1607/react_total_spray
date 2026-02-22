import mongoose, { Schema, Document } from "mongoose";

export interface IClientDocument extends Document {
  companyName: string;
  companyLogo?: string;
  userId?: mongoose.Types.ObjectId;
  address?: string;
  abn?: string;
  singleSite?: number;
  accessToken?: string;
  dateTime?: Date;
  status: number;
}

const ClientSchema = new Schema<IClientDocument>(
  {
    companyName: { type: String, required: true },
    companyLogo: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    address: { type: String },
    abn: { type: String },
    singleSite: { type: Number },
    accessToken: { type: String },
    dateTime: { type: Date },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

ClientSchema.index({ companyName: 1 });
ClientSchema.index({ status: 1 });

export default mongoose.models.Client || mongoose.model<IClientDocument>("Client", ClientSchema);
