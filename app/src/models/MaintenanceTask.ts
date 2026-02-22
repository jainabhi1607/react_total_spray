import mongoose, { Schema, Document } from "mongoose";

export interface IMaintenanceTaskDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  title: string;
  dateTime?: Date;
}

const MaintenanceTaskSchema = new Schema<IMaintenanceTaskDocument>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    title: { type: String, required: true },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

MaintenanceTaskSchema.index({ clientId: 1 });

export default mongoose.models.MaintenanceTask || mongoose.model<IMaintenanceTaskDocument>("MaintenanceTask", MaintenanceTaskSchema);
