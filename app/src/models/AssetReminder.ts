import mongoose, { Schema, Document } from "mongoose";

export interface IAssetReminderDocument extends Document {
  clientAssetId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  reminder?: string;
  remindDate?: Date;
  status?: number;
  dateTime?: Date;
}

const AssetReminderSchema = new Schema<IAssetReminderDocument>(
  {
    clientAssetId: { type: Schema.Types.ObjectId, ref: "ClientAsset", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reminder: { type: String },
    remindDate: { type: Date },
    status: { type: Number },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

AssetReminderSchema.index({ clientAssetId: 1 });

export default mongoose.models.AssetReminder || mongoose.model<IAssetReminderDocument>("AssetReminder", AssetReminderSchema);
