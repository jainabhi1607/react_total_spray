import mongoose, { Schema, Document } from "mongoose";

export interface IClientAssetDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  clientSiteId?: mongoose.Types.ObjectId;
  machineName: string;
  serialNo?: string;
  assetTypeId?: string;
  assetMakeId?: mongoose.Types.ObjectId;
  assetModelId?: mongoose.Types.ObjectId;
  image?: string;
  notes?: string;
  notesEditDateTime?: Date;
  dateTime?: Date;
  status: number;
}

const ClientAssetSchema = new Schema<IClientAssetDocument>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    clientSiteId: { type: Schema.Types.ObjectId, ref: "ClientSite" },
    machineName: { type: String, required: true },
    serialNo: { type: String },
    assetTypeId: { type: String },
    assetMakeId: { type: Schema.Types.ObjectId, ref: "AssetMake" },
    assetModelId: { type: Schema.Types.ObjectId, ref: "AssetModel" },
    image: { type: String },
    notes: { type: String },
    notesEditDateTime: { type: Date },
    dateTime: { type: Date },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

ClientAssetSchema.index({ clientId: 1 });
ClientAssetSchema.index({ clientSiteId: 1 });

export default mongoose.models.ClientAsset || mongoose.model<IClientAssetDocument>("ClientAsset", ClientAssetSchema);
