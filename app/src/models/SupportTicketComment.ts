import mongoose, { Schema, Document } from "mongoose";

export interface ISupportTicketCommentDocument extends Document {
  supportTicketId?: mongoose.Types.ObjectId;
  comments?: string;
  commentType?: number;
  userId?: mongoose.Types.ObjectId;
  dateTime?: Date;
  visibility?: number;
}

const SupportTicketCommentSchema = new Schema<ISupportTicketCommentDocument>(
  {
    supportTicketId: { type: Schema.Types.ObjectId, ref: "SupportTicket" },
    comments: { type: String },
    commentType: { type: Number },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    dateTime: { type: Date },
    visibility: { type: Number },
  },
  { timestamps: true }
);

SupportTicketCommentSchema.index({ supportTicketId: 1 });

export default mongoose.models.SupportTicketComment || mongoose.model<ISupportTicketCommentDocument>("SupportTicketComment", SupportTicketCommentSchema);
