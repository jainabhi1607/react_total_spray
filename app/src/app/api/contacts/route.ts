import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  handleApiError,
  getSearchParams,
} from "@/lib/api-helpers";
import ClientContact from "@/models/ClientContact";
import "@/models/Client";
import "@/models/ClientSite";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    await requireAuth();

    const { search } = getSearchParams(req);

    const query: Record<string, any> = {};
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
