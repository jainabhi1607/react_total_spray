import mongoose, { Schema, Document } from "mongoose";

export interface IResourceCategoryDocument extends Document {
  title: string;
  dateTime?: Date;
}

const ResourceCategorySchema = new Schema<IResourceCategoryDocument>(
  {
    title: { type: String, required: true },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.ResourceCategory || mongoose.model<IResourceCategoryDocument>("ResourceCategory", ResourceCategorySchema);
