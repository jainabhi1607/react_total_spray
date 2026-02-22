import mongoose, { Schema, Document } from "mongoose";

export interface ISupportTicketTechnicianDocument extends Document {
  supportTicketId: mongoose.Types.ObjectId;
  technicianId: mongoose.Types.ObjectId;
  onSite?: number;
  dateTime?: Date;
  addedBy?: mongoose.Types.ObjectId;
}

const SupportTicketTechnicianSchema = new Schema<ISupportTicketTechnicianDocument>(
  {
    supportTicketId: { type: Schema.Types.ObjectId, ref: "SupportTicket", required: true },
    technicianId: { type: Schema.Types.ObjectId, ref: "Technician", required: true },
    onSite: { type: Number },
    dateTime: { type: Date },
    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

SupportTicketTechnicianSchema.index({ supportTicketId: 1 });

export default mongoose.models.SupportTicketTechnician || mongoose.model<ISupportTicketTechnicianDocument>("SupportTicketTechnician", SupportTicketTechnicianSchema);
