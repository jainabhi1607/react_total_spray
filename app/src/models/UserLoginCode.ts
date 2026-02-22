import mongoose, { Schema, Document } from "mongoose";

export interface IUserLoginCodeDocument extends Document {
  userId: mongoose.Types.ObjectId;
  otp: number;
  expiryTime: Date;
  status?: number;
}

const UserLoginCodeSchema = new Schema<IUserLoginCodeDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    otp: { type: Number, required: true },
    expiryTime: { type: Date, required: true },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

UserLoginCodeSchema.index({ userId: 1 });

export default mongoose.models.UserLoginCode || mongoose.model<IUserLoginCodeDocument>("UserLoginCode", UserLoginCodeSchema);
