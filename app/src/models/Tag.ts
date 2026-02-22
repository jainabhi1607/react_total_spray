import mongoose, { Schema, Document } from "mongoose";

export interface ITagDocument extends Document {
  title: string;
  dateTime?: Date;
}

const TagSchema = new Schema<ITagDocument>(
  {
    title: { type: String, required: true },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Tag || mongoose.model<ITagDocument>("Tag", TagSchema);
