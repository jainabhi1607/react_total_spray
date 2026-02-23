import mongoose, { Schema, Document } from "mongoose";

export interface IClientDocumentDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  documentName?: string;
  fileName?: string;
  fileSize?: string;
  documentCounter?: number;
  isPublic?: number;
  dateTime?: Date;
}

const ClientDocumentSchema = new Schema<IClientDocumentDocument>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    documentName: { type: String },
    fileName: { type: String },
    fileSize: { type: String },
    documentCounter: { type: Number },
    isPublic: { type: Number, default: 0 },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

ClientDocumentSchema.index({ clientId: 1 });

export default mongoose.models.ClientDocument || mongoose.model<IClientDocumentDocument>("ClientDocument", ClientDocumentSchema);
