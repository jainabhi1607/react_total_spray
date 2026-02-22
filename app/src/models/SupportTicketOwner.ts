import mongoose, { Schema, Document } from "mongoose";

export interface ISupportTicketOwnerDocument extends Document {
  supportTicketId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  dateTime?: Date;
  addedBy?: mongoose.Types.ObjectId;
}

const SupportTicketOwnerSchema = new Schema<ISupportTicketOwnerDocument>(
  {
    supportTicketId: { type: Schema.Types.ObjectId, ref: "SupportTicket", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dateTime: { type: Date },
    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

SupportTicketOwnerSchema.index({ supportTicketId: 1 });

export default mongoose.models.SupportTicketOwner || mongoose.model<ISupportTicketOwnerDocument>("SupportTicketOwner", SupportTicketOwnerSchema);
