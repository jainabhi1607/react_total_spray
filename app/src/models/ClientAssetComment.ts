import mongoose, { Schema, Document } from "mongoose";

export interface IClientAssetCommentDocument extends Document {
  clientAssetId: mongoose.Types.ObjectId;
  comments?: string;
  commentType?: number;
  userId: mongoose.Types.ObjectId;
  dateTime?: Date;
}

const ClientAssetCommentSchema = new Schema<IClientAssetCommentDocument>(
  {
    clientAssetId: { type: Schema.Types.ObjectId, ref: "ClientAsset", required: true },
    comments: { type: String },
    commentType: { type: Number },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

ClientAssetCommentSchema.index({ clientAssetId: 1 });

export default mongoose.models.ClientAssetComment || mongoose.model<IClientAssetCommentDocument>("ClientAssetComment", ClientAssetCommentSchema);
