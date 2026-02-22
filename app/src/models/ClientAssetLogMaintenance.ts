import mongoose, { Schema, Document } from "mongoose";

export interface IClientAssetLogMaintenanceDocument extends Document {
  clientAssetId: mongoose.Types.ObjectId;
  task?: string;
  taskName?: string;
  notes?: string;
  taskDate?: Date;
  dateTime?: Date;
}

const ClientAssetLogMaintenanceSchema = new Schema<IClientAssetLogMaintenanceDocument>(
  {
    clientAssetId: { type: Schema.Types.ObjectId, ref: "ClientAsset", required: true },
    task: { type: String },
    taskName: { type: String },
    notes: { type: String },
    taskDate: { type: Date },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

ClientAssetLogMaintenanceSchema.index({ clientAssetId: 1 });

export default mongoose.models.ClientAssetLogMaintenance || mongoose.model<IClientAssetLogMaintenanceDocument>("ClientAssetLogMaintenance", ClientAssetLogMaintenanceSchema);
