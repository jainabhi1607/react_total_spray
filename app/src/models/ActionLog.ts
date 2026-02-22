import mongoose, { Schema, Document } from "mongoose";

export interface IActionLogDocument extends Document {
  adminId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  tasks?: string;
  actionType?: number;
  dateTime?: Date;
}

const ActionLogSchema = new Schema<IActionLogDocument>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    tasks: { type: String },
    actionType: { type: Number },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

ActionLogSchema.index({ userId: 1 });

export default mongoose.models.ActionLog || mongoose.model<IActionLogDocument>("ActionLog", ActionLogSchema);
