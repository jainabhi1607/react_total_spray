import mongoose, { Schema, Document } from "mongoose";

export interface IUserGroupClientAssetDocument extends Document {
  userGroupId: mongoose.Types.ObjectId;
  userGroupSiteId?: mongoose.Types.ObjectId;
  clientAssetId: mongoose.Types.ObjectId;
}

const UserGroupClientAssetSchema = new Schema<IUserGroupClientAssetDocument>(
  {
    userGroupId: { type: Schema.Types.ObjectId, ref: "UserGroup", required: true },
    userGroupSiteId: { type: Schema.Types.ObjectId, ref: "UserGroupClientSite" },
    clientAssetId: { type: Schema.Types.ObjectId, ref: "ClientAsset", required: true },
  },
  { timestamps: true }
);

UserGroupClientAssetSchema.index({ userGroupId: 1 });

export default mongoose.models.UserGroupClientAsset || mongoose.model<IUserGroupClientAssetDocument>("UserGroupClientAsset", UserGroupClientAssetSchema);
