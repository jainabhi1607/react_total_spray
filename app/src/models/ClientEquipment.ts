import mongoose, { Schema, Document } from "mongoose";

export interface IClientEquipmentDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  clientSiteId?: mongoose.Types.ObjectId;
  machineName: string;
  serialNo?: string;
  equipmentDate?: Date;
  equipmentType?: string;
  dateTime?: Date;
  status: number;
}

const ClientEquipmentSchema = new Schema<IClientEquipmentDocument>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    clientSiteId: { type: Schema.Types.ObjectId, ref: "ClientSite" },
    machineName: { type: String, required: true },
    serialNo: { type: String },
    equipmentDate: { type: Date },
    equipmentType: { type: String },
    dateTime: { type: Date },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

ClientEquipmentSchema.index({ clientId: 1 });

export default mongoose.models.ClientEquipment || mongoose.model<IClientEquipmentDocument>("ClientEquipment", ClientEquipmentSchema);
