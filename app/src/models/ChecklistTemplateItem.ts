import mongoose, { Schema, Document } from "mongoose";

export interface IChecklistTemplateItemDocument extends Document {
  checklistTemplateId: mongoose.Types.ObjectId;
  details?: string;
  checklistItemType?: number;
  makeResponseMandatory?: number;
  fileName?: string;
  fileSize?: string;
  fileRealName?: string;
  orderNo?: number;
}

const ChecklistTemplateItemSchema = new Schema<IChecklistTemplateItemDocument>(
  {
    checklistTemplateId: { type: Schema.Types.ObjectId, ref: "ChecklistTemplate", required: true },
    details: { type: String },
    checklistItemType: { type: Number },
    makeResponseMandatory: { type: Number },
    fileName: { type: String },
    fileSize: { type: String },
    fileRealName: { type: String },
    orderNo: { type: Number },
  },
  { timestamps: true }
);

ChecklistTemplateItemSchema.index({ checklistTemplateId: 1 });

export default mongoose.models.ChecklistTemplateItem || mongoose.model<IChecklistTemplateItemDocument>("ChecklistTemplateItem", ChecklistTemplateItemSchema);
