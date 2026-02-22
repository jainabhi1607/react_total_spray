import mongoose, { Schema, Document } from "mongoose";

export interface IClientSiteDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  siteName: string;
  address?: string;
  siteId?: string;
  dateTime?: Date;
  status: number;
}

const ClientSiteSchema = new Schema<IClientSiteDocument>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    siteName: { type: String, required: true },
    address: { type: String },
    siteId: { type: String },
    dateTime: { type: Date },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

ClientSiteSchema.index({ clientId: 1 });

export default mongoose.models.ClientSite || mongoose.model<IClientSiteDocument>("ClientSite", ClientSiteSchema);
