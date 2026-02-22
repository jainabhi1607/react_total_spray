import mongoose, { Schema, Document } from "mongoose";

export interface ISupportTicketLogDocument extends Document {
  supportTicketId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  task?: string;
  dateTime?: Date;
}

const SupportTicketLogSchema = new Schema<ISupportTicketLogDocument>(
  {
    supportTicketId: { type: Schema.Types.ObjectId, ref: "SupportTicket" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    task: { type: String },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

SupportTicketLogSchema.index({ supportTicketId: 1 });

export default mongoose.models.SupportTicketLog || mongoose.model<ISupportTicketLogDocument>("SupportTicketLog", SupportTicketLogSchema);
