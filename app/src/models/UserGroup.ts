import mongoose, { Schema, Document } from "mongoose";

export interface IUserGroupDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  menus?: string;
  sites?: string;
  assets?: string;
  users?: string;
  defaultGroup?: number;
  dateTime?: Date;
}

const UserGroupSchema = new Schema<IUserGroupDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    menus: { type: String },
    sites: { type: String },
    assets: { type: String },
    users: { type: String },
    defaultGroup: { type: Number },
    dateTime: { type: Date },
  },
  { timestamps: true }
);

UserGroupSchema.index({ userId: 1 });

export default mongoose.models.UserGroup || mongoose.model<IUserGroupDocument>("UserGroup", UserGroupSchema);
