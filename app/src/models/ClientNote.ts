import mongoose, { Schema, Document } from "mongoose";

export interface IClientNoteDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  notes: string;
  noteType?: number;
  userId: mongoose.Types.ObjectId;
  dateTime?: Date;
}

const ClientNoteSchema = new Schema<IClientNoteDocument>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    notes: { type: String, required: true },
    noteType: { type: Number },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

ClientNoteSchema.index({ clientId: 1 });

export default mongoose.models.ClientNote || mongoose.model<IClientNoteDocument>("ClientNote", ClientNoteSchema);
