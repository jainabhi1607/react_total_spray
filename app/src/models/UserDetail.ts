import mongoose, { Schema, Document } from "mongoose";

export interface IUserDetailDocument extends Document {
  userId: mongoose.Types.ObjectId;
  profilePic?: string;
  customFields?: string;
  twoFactorAuth?: number;
  resetToken?: string;
  invitationExpiryDate?: Date;
  authcode?: string;
  dateTime?: Date;
}

const UserDetailSchema = new Schema<IUserDetailDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    profilePic: { type: String },
    customFields: { type: String },
    twoFactorAuth: { type: Number },
    resetToken: { type: String },
    invitationExpiryDate: { type: Date },
    authcode: { type: String },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

UserDetailSchema.index({ userId: 1 });

export default mongoose.models.UserDetail || mongoose.model<IUserDetailDocument>("UserDetail", UserDetailSchema);
