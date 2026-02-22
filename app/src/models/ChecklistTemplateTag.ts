import mongoose, { Schema, Document } from "mongoose";

export interface IChecklistTemplateTagDocument extends Document {
  checklistTemplateId: mongoose.Types.ObjectId;
  checklistTagId: mongoose.Types.ObjectId;
  dateTime?: Date;
}

const ChecklistTemplateTagSchema = new Schema<IChecklistTemplateTagDocument>(
  {
    checklistTemplateId: { type: Schema.Types.ObjectId, ref: "ChecklistTemplate", required: true },
    checklistTagId: { type: Schema.Types.ObjectId, ref: "ChecklistTag", required: true },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

ChecklistTemplateTagSchema.index({ checklistTemplateId: 1 });

export default mongoose.models.ChecklistTemplateTag || mongoose.model<IChecklistTemplateTagDocument>("ChecklistTemplateTag", ChecklistTemplateTagSchema);
