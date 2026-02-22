import mongoose, { Schema, Document } from "mongoose";

export interface IResourceDocument extends Document {
  resourceCategoryId?: mongoose.Types.ObjectId;
  resourceName: string;
  thumbnail?: string;
  resourceFile?: string;
  dateTime?: Date;
  status?: number;
}

const ResourceSchema = new Schema<IResourceDocument>(
  {
    resourceCategoryId: { type: Schema.Types.ObjectId, ref: "ResourceCategory" },
    resourceName: { type: String, required: true },
    thumbnail: { type: String },
    resourceFile: { type: String },
    dateTime: { type: Date },
    status: { type: Number },
  },
  { timestamps: true }
);

ResourceSchema.index({ resourceCategoryId: 1 });

export default mongoose.models.Resource || mongoose.model<IResourceDocument>("Resource", ResourceSchema);
