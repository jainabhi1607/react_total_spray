import mongoose, { Schema, Document } from "mongoose";

export interface ITitleDocument extends Document {
  title: string;
  dateTime?: Date;
}

const TitleSchema = new Schema<ITitleDocument>(
  {
    title: { type: String, required: true },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Title || mongoose.model<ITitleDocument>("Title", TitleSchema);
