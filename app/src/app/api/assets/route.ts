import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ClientAsset from "@/models/ClientAsset";
import SupportTicket from "@/models/SupportTicket";
import "@/models/Client";
import "@/models/ClientSite";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const siteId = searchParams.get("siteId");

    const query: Record<string, any> = { status: { $ne: 2 } };
    if (clientId) query.clientId = clientId;
    if (siteId) query.clientSiteId = siteId;

    const assets = await ClientAsset.find(query)
      .populate("clientId", "companyName")
      .populate("clientSiteId", "siteName")
      .sort({ machineName: 1 })
      .lean();

    // Get last ticket date for each asset
    const assetIds = assets.map((a: any) => a._id);
    const lastTickets = await SupportTicket.aggregate([
      { $match: { clientAssetId: { $in: assetIds }, status: { $ne: 2 } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$clientAssetId", lastTicketDate: { $first: "$createdAt" } } },
    ]);

    const ticketMap = new Map(
      lastTickets.map((t: any) => [t._id.toString(), t.lastTicketDate])
    );

    const result = assets.map((a: any) => ({
      ...a,
      lastTicketDate: ticketMap.get(a._id.toString()) || null,
    }));

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
