import mongoose, { Schema, Document } from "mongoose";

export interface IAssetMakeModelDocument extends Document {
  assetMakeId: mongoose.Types.ObjectId;
  assetModelId: mongoose.Types.ObjectId;
  dateTime?: Date;
}

const AssetMakeModelSchema = new Schema<IAssetMakeModelDocument>(
  {
    assetMakeId: { type: Schema.Types.ObjectId, ref: "AssetMake", required: true },
    assetModelId: { type: Schema.Types.ObjectId, ref: "AssetModel", required: true },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

AssetMakeModelSchema.index({ assetMakeId: 1 });

export default mongoose.models.AssetMakeModel || mongoose.model<IAssetMakeModelDocument>("AssetMakeModel", AssetMakeModelSchema);
