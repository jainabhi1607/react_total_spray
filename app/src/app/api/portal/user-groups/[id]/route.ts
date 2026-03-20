import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import UserGroup from "@/models/UserGroup";
import UserGroupUser from "@/models/UserGroupUser";
import UserGroupClientSite from "@/models/UserGroupClientSite";
import UserGroupClientAsset from "@/models/UserGroupClientAsset";
import ClientSite from "@/models/ClientSite";
import ClientAsset from "@/models/ClientAsset";
import User from "@/models/User";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();

    if (session.role !== 4 || !session.clientId) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;

    const group = await UserGroup.findOne({ _id: id, userId: session.clientId }).lean();
    if (!group) return errorResponse("User group not found", 404);

    const [groupUsers, groupSites, groupAssets, allSites, allAssets, allUsers] =
      await Promise.all([
        UserGroupUser.find({ userGroupId: id }).populate("userId", "name lastName email role").lean(),
        UserGroupClientSite.find({ userGroupId: id }).lean(),
        UserGroupClientAsset.find({ userGroupId: id }).lean(),
        ClientSite.find({ clientId: session.clientId, status: 1 })
          .select("siteName address")
          .sort({ siteName: 1 })
          .lean(),
        ClientAsset.find({ clientId: session.clientId, status: { $ne: 2 } })
          .select("machineName serialNo clientSiteId")
          .sort({ machineName: 1 })
          .lean(),
        User.find({ clientId: session.clientId, role: { $in: [4, 6] }, status: { $in: [1, 25] } })
          .select("name lastName email role")
          .sort({ name: 1 })
          .lean(),
      ]);

    return successResponse({
      group,
      groupUsers,
      groupSites: groupSites.map((s: any) => String(s.clientSiteId)),
      groupAssets: groupAssets.map((a: any) => String(a.clientAssetId)),
      allSites,
      allAssets,
      allUsers,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();

    if (session.role !== 4 || !session.clientId) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;
    const group = await UserGroup.findOne({ _id: id, userId: session.clientId });
    if (!group) return errorResponse("User group not found", 404);

    const body = await req.json();
    const { title, menus, userIds, sites } = body;
    // sites: [{ clientSiteId: string, assetIds: string[] }]

    // Update title if provided
    if (title !== undefined) group.title = title;
    if (menus !== undefined) group.menus = menus;

    // Rebuild users
    if (userIds !== undefined) {
      await UserGroupUser.deleteMany({ userGroupId: id });
      if (userIds.length > 0) {
        await UserGroupUser.insertMany(
          userIds.map((uid: string) => ({ userGroupId: id, userId: uid }))
        );
      }
      group.users = userIds.join(",");
    }

    // Rebuild sites and assets
    if (sites !== undefined) {
      await UserGroupClientAsset.deleteMany({ userGroupId: id });
      await UserGroupClientSite.deleteMany({ userGroupId: id });

      const allAssetIds: string[] = [];
      const allSiteIds: string[] = [];

      for (const site of sites) {
        const siteDoc = await UserGroupClientSite.create({
          userGroupId: id,
          clientSiteId: site.clientSiteId,
        });
        allSiteIds.push(site.clientSiteId);

        if (site.assetIds && site.assetIds.length > 0) {
          await UserGroupClientAsset.insertMany(
            site.assetIds.map((aid: string) => ({
              userGroupId: id,
              userGroupSiteId: siteDoc._id,
              clientAssetId: aid,
            }))
          );
          allAssetIds.push(...site.assetIds);
        }
      }

      group.sites = allSiteIds.join(",");
      group.assets = allAssetIds.join(",");
    }

    await group.save();

    return successResponse(group);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();

    if (session.role !== 4 || !session.clientId) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;
    const group = await UserGroup.findOne({ _id: id, userId: session.clientId });
    if (!group) return errorResponse("User group not found", 404);

    if (group.defaultGroup === 1) {
      return errorResponse("Cannot delete default group");
    }

    await Promise.all([
      UserGroupClientAsset.deleteMany({ userGroupId: id }),
      UserGroupClientSite.deleteMany({ userGroupId: id }),
      UserGroupUser.deleteMany({ userGroupId: id }),
      UserGroup.findByIdAndDelete(id),
    ]);

    return successResponse({ message: "User group deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
