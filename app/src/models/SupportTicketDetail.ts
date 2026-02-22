import mongoose, { Schema, Document } from "mongoose";

export interface ISupportTicketDetailDocument extends Document {
  supportTicketId: mongoose.Types.ObjectId;
  description?: string;
  supportingEvidence1?: string;
  supportingEvidence2?: string;
  supportingEvidence3?: string;
  supportingEvidenceSize1?: string;
  supportingEvidenceSize2?: string;
  supportingEvidenceSize3?: string;
  supportingEvidenceName1?: string;
  supportingEvidenceName2?: string;
  supportingEvidenceName3?: string;
  resolvedComments?: string;
  resolvedDate?: Date;
  rootCause?: string;
  rootCauseUserId?: mongoose.Types.ObjectId;
  rootCauseDateTime?: Date;
  resolution?: string;
  resolutionUserId?: mongoose.Types.ObjectId;
  resolutionDateTime?: Date;
}

const SupportTicketDetailSchema = new Schema<ISupportTicketDetailDocument>(
  {
    supportTicketId: { type: Schema.Types.ObjectId, ref: "SupportTicket", required: true },
    description: { type: String },
    supportingEvidence1: { type: String },
    supportingEvidence2: { type: String },
    supportingEvidence3: { type: String },
    supportingEvidenceSize1: { type: String },
    supportingEvidenceSize2: { type: String },
    supportingEvidenceSize3: { type: String },
    supportingEvidenceName1: { type: String },
    supportingEvidenceName2: { type: String },
    supportingEvidenceName3: { type: String },
    resolvedComments: { type: String },
    resolvedDate: { type: Date },
    rootCause: { type: String },
    rootCauseUserId: { type: Schema.Types.ObjectId, ref: "User" },
    rootCauseDateTime: { type: Date },
    resolution: { type: String },
    resolutionUserId: { type: Schema.Types.ObjectId, ref: "User" },
    resolutionDateTime: { type: Date },
  },
  { timestamps: true }
);

SupportTicketDetailSchema.index({ supportTicketId: 1 });

export default mongoose.models.SupportTicketDetail || mongoose.model<ISupportTicketDetailDocument>("SupportTicketDetail", SupportTicketDetailSchema);
