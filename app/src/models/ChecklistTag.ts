import mongoose, { Schema, Document } from "mongoose";

export interface IChecklistTagDocument extends Document {
  title: string;
  dateTime?: Date;
}

const ChecklistTagSchema = new Schema<IChecklistTagDocument>(
  {
    title: { type: String, required: true },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.ChecklistTag || mongoose.model<IChecklistTagDocument>("ChecklistTag", ChecklistTagSchema);
