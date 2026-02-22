import mongoose, { Schema, Document } from "mongoose";

export interface IUserGroupClientSiteDocument extends Document {
  userGroupId: mongoose.Types.ObjectId;
  clientSiteId: mongoose.Types.ObjectId;
}

const UserGroupClientSiteSchema = new Schema<IUserGroupClientSiteDocument>(
  {
    userGroupId: { type: Schema.Types.ObjectId, ref: "UserGroup", required: true },
    clientSiteId: { type: Schema.Types.ObjectId, ref: "ClientSite", required: true },
  },
  { timestamps: true }
);

UserGroupClientSiteSchema.index({ userGroupId: 1 });

export default mongoose.models.UserGroupClientSite || mongoose.model<IUserGroupClientSiteDocument>("UserGroupClientSite", UserGroupClientSiteSchema);
