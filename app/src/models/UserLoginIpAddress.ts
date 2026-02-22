import mongoose, { Schema, Document } from "mongoose";

export interface IUserLoginIpAddressDocument extends Document {
  userId: mongoose.Types.ObjectId;
  ipAddress?: string;
  city?: string;
  dateTime?: Date;
  loginResponse?: string;
}

const UserLoginIpAddressSchema = new Schema<IUserLoginIpAddressDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ipAddress: { type: String },
    city: { type: String },
    dateTime: { type: Date },
    loginResponse: { type: String },
  },
  { timestamps: true }
);

UserLoginIpAddressSchema.index({ userId: 1 });

export default mongoose.models.UserLoginIpAddress || mongoose.model<IUserLoginIpAddressDocument>("UserLoginIpAddress", UserLoginIpAddressSchema);
