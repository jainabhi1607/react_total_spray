import mongoose, { Schema, Document } from "mongoose";

export interface IUserGroupUserDocument extends Document {
  userGroupId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
}

const UserGroupUserSchema = new Schema<IUserGroupUserDocument>(
  {
    userGroupId: { type: Schema.Types.ObjectId, ref: "UserGroup", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

UserGroupUserSchema.index({ userGroupId: 1 });
UserGroupUserSchema.index({ userId: 1 });

export default mongoose.models.UserGroupUser || mongoose.model<IUserGroupUserDocument>("UserGroupUser", UserGroupUserSchema);
