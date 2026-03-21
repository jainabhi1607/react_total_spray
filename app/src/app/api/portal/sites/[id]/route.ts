import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ClientSite from "@/models/ClientSite";
import ClientAsset from "@/models/ClientAsset";
import ClientContact from "@/models/ClientContact";
import SupportTicket from "@/models/SupportTicket";
import "@/models/AssetMake";
import "@/models/AssetModel";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();

    if (![4, 6].includes(session.role) || !session.clientId) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;

    const site = await ClientSite.findById(id).lean();
    if (!site) {
      return errorResponse("Site not found", 404);
    }

    // Ensure site belongs to this portal user's client
    if (String((site as any).clientId) !== String(session.clientId)) {
      return errorResponse("Forbidden", 403);
    }

    // Fetch assets for this site
    const assets = await ClientAsset.find({
      clientSiteId: id,
      clientId: session.clientId,
      status: { $ne: 2 },
    })
      .populate("assetMakeId", "title")
      .populate("assetModelId", "title")
      .sort({ createdAt: -1 })
      .lean();

    // Get last support ticket date per asset for "Last Action"
    const assetIds = assets.map((a: any) => a._id);
    const lastTickets = await SupportTicket.aggregate([
      { $match: { clientAssetId: { $in: assetIds }, status: { $ne: 2 } } },
      { $group: { _id: "$clientAssetId", lastDate: { $max: "$createdAt" } } },
    ]);
    const lastActionMap = new Map(
      lastTickets.map((t: any) => [String(t._id), t.lastDate])
    );

    const assetsWithLastAction = assets.map((asset: any) => ({
      ...asset,
      lastAction: lastActionMap.get(String(asset._id)) || null,
    }));

    // Fetch contacts for this site + general contacts (no site)
    const contacts = await ClientContact.find({
      clientId: session.clientId,
      $or: [{ clientSiteId: id }, { clientSiteId: null }, { clientSiteId: { $exists: false } }],
    })
      .sort({ name: 1 })
      .lean();

    return successResponse({
      site,
      assets: assetsWithLastAction,
      contacts,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
