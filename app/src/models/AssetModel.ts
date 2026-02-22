import mongoose, { Schema, Document } from "mongoose";

export interface IAssetModelDocument extends Document {
  title: string;
  assetTypeId?: mongoose.Types.ObjectId;
  dateTime?: Date;
}

const AssetModelSchema = new Schema<IAssetModelDocument>(
  {
    title: { type: String, required: true },
    assetTypeId: { type: Schema.Types.ObjectId, ref: "AssetType" },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.AssetModel || mongoose.model<IAssetModelDocument>("AssetModel", AssetModelSchema);
