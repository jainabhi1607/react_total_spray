import mongoose, { Schema, Document } from "mongoose";

export interface IClientAssetAttachmentDocument extends Document {
  clientAssetId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  dateTime?: Date;
  documentName?: string;
  fileName?: string;
  fileSize?: number;
}

const ClientAssetAttachmentSchema = new Schema<IClientAssetAttachmentDocument>(
  {
    clientAssetId: { type: Schema.Types.ObjectId, ref: "ClientAsset", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    dateTime: { type: Date },
    documentName: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
  },
  { timestamps: true }
);

ClientAssetAttachmentSchema.index({ clientAssetId: 1 });

export default mongoose.models.ClientAssetAttachment || mongoose.model<IClientAssetAttachmentDocument>("ClientAssetAttachment", ClientAssetAttachmentSchema);
