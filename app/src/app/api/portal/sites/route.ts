import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ClientSite from "@/models/ClientSite";
import ClientAsset from "@/models/ClientAsset";

export async function GET() {
  try {
    await dbConnect();
    const session = await requireAuth();

    if (![4, 6].includes(session.role) || !session.clientId) {
      return errorResponse("Forbidden", 403);
    }

    const sites = await ClientSite.find({
      clientId: session.clientId,
      status: 1,
    })
      .sort({ siteName: 1 })
      .lean();

    // Get asset counts per site
    const siteIds = sites.map((s: any) => s._id);
    const assetCounts = await ClientAsset.aggregate([
      { $match: { clientSiteId: { $in: siteIds }, status: 1 } },
      { $group: { _id: "$clientSiteId", count: { $sum: 1 } } },
    ]);

    const countMap = new Map(assetCounts.map((a: any) => [a._id.toString(), a.count]));

    const result = sites.map((site: any) => ({
      ...site,
      assetCount: countMap.get(site._id.toString()) || 0,
    }));

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
