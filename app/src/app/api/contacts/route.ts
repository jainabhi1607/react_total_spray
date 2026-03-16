import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
  getSearchParams,
} from "@/lib/api-helpers";
import ClientContact from "@/models/ClientContact";
import "@/models/Client";
import "@/models/ClientSite";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await requireAuth();

    const { search } = getSearchParams(req);

    const query: Record<string, any> = {};

    // Portal users can only see their own client's contacts
    if ([4, 6].includes(session.role)) {
      if (!session.clientId) {
        return errorResponse("No client associated with this account", 403);
      }
      query.clientId = session.clientId;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const contacts = await ClientContact.find(query)
      .populate("clientId", "companyName")
      .populate("clientSiteId", "siteName")
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(contacts);
  } catch (error) {
    return handleApiError(error);
  }
}
