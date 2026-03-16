import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import Client from "@/models/Client";
import ClientSite from "@/models/ClientSite";
import ClientAsset from "@/models/ClientAsset";
import ClientContact from "@/models/ClientContact";

export async function GET() {
  try {
    await dbConnect();
    const session = await requireAuth();

    if (![4, 6].includes(session.role) || !session.clientId) {
      return errorResponse("Forbidden", 403);
    }

    const [client, siteCount, assetCount, contactCount] = await Promise.all([
      Client.findById(session.clientId)
        .select("companyName companyLogo address abn")
        .lean(),
      ClientSite.countDocuments({ clientId: session.clientId, status: 1 }),
      ClientAsset.countDocuments({ clientId: session.clientId, status: { $ne: 2 } }),
      ClientContact.countDocuments({ clientId: session.clientId }),
    ]);

    if (!client) {
      return errorResponse("Company not found", 404);
    }

    return successResponse({
      ...(client as any),
      siteCount,
      assetCount,
      contactCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
