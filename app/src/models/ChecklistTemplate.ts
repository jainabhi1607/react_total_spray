import mongoose, { Schema, Document } from "mongoose";

export interface IChecklistTemplateDocument extends Document {
  userId?: mongoose.Types.ObjectId;
  adminId?: mongoose.Types.ObjectId;
  title: string;
  dateTime?: Date;
}

const ChecklistTemplateSchema = new Schema<IChecklistTemplateDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    adminId: { type: Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.ChecklistTemplate || mongoose.model<IChecklistTemplateDocument>("ChecklistTemplate", ChecklistTemplateSchema);
