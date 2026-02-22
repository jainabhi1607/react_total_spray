import mongoose, { Schema, Document } from "mongoose";

export interface IUserDocument extends Document {
  adminId?: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  username?: string;
  password: string;
  name: string;
  lastName?: string;
  email: string;
  phone?: string;
  position?: string;
  role: number;
  status: number;
}

const UserSchema = new Schema<IUserDocument>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User" },
    clientId: { type: Schema.Types.ObjectId, ref: "Client" },
    username: { type: String },
    password: { type: String, required: true },
    name: { type: String, required: true },
    lastName: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    position: { type: String },
    role: { type: Number, required: true },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });
UserSchema.index({ name: 1, lastName: 1 });

export default mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
