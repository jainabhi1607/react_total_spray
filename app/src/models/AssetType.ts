import mongoose, { Schema, Document } from "mongoose";

export interface IAssetTypeDocument extends Document {
  title: string;
  dateTime?: Date;
}

const AssetTypeSchema = new Schema<IAssetTypeDocument>(
  {
    title: { type: String, required: true },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.AssetType || mongoose.model<IAssetTypeDocument>("AssetType", AssetTypeSchema);
