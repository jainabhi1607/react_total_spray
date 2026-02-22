import mongoose, { Schema, Document } from "mongoose";

export interface ISupportTicketTimeDocument extends Document {
  supportTicketId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  timeHours?: number;
  timeMinutes?: number;
  timeDate?: Date;
  description?: string;
  timeType?: number;
  dateTime?: Date;
}

const SupportTicketTimeSchema = new Schema<ISupportTicketTimeDocument>(
  {
    supportTicketId: { type: Schema.Types.ObjectId, ref: "SupportTicket", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    timeHours: { type: Number },
    timeMinutes: { type: Number },
    timeDate: { type: Date },
    description: { type: String },
    timeType: { type: Number },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

SupportTicketTimeSchema.index({ supportTicketId: 1 });

export default mongoose.models.SupportTicketTime || mongoose.model<ISupportTicketTimeDocument>("SupportTicketTime", SupportTicketTimeSchema);
