import mongoose, { Schema, Document } from "mongoose";

export interface IAssetMakeDocument extends Document {
  title: string;
  dateTime?: Date;
}

const AssetMakeSchema = new Schema<IAssetMakeDocument>(
  {
    title: { type: String, required: true },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.AssetMake || mongoose.model<IAssetMakeDocument>("AssetMake", AssetMakeSchema);
