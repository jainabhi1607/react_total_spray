import mongoose, { Schema, Document } from "mongoose";

export interface IClientContactDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  clientSiteId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  name: string;
  lastName?: string;
  position?: string;
  email?: string;
  phone?: string;
  dateTime?: Date;
}

const ClientContactSchema = new Schema<IClientContactDocument>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    clientSiteId: { type: Schema.Types.ObjectId, ref: "ClientSite" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    lastName: { type: String },
    position: { type: String },
    email: { type: String },
    phone: { type: String },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

ClientContactSchema.index({ clientId: 1 });

export default mongoose.models.ClientContact || mongoose.model<IClientContactDocument>("ClientContact", ClientContactSchema);
