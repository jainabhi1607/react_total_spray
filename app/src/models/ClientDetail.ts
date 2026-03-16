import mongoose, { Schema, Document } from "mongoose";

export interface IClientDetailDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  about?: string;
}

const ClientDetailSchema = new Schema<IClientDetailDocument>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    about: { type: String },
  },
  { timestamps: true }
);

ClientDetailSchema.index({ clientId: 1 });

export default mongoose.models.ClientDetail || mongoose.model<IClientDetailDocument>("ClientDetail", ClientDetailSchema);
