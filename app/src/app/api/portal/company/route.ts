import { NextRequest } from "next/server";
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
import User from "@/models/User";

export async function GET() {
  try {
    await dbConnect();
    const session = await requireAuth();

    if (![4, 6].includes(session.role) || !session.clientId) {
      return errorResponse("Forbidden", 403);
    }

    const [client, siteCount, assetCount, contactCount, userCount, users] = await Promise.all([
      Client.findById(session.clientId)
        .select("companyName companyLogo address abn")
        .lean(),
      ClientSite.countDocuments({ clientId: session.clientId, status: 1 }),
      ClientAsset.countDocuments({ clientId: session.clientId, status: { $ne: 2 } }),
      ClientContact.countDocuments({ clientId: session.clientId }),
      User.countDocuments({ clientId: session.clientId, role: { $in: [4, 6] } }),
      User.find({ clientId: session.clientId, role: { $in: [4, 6] } })
        .select("name lastName email role status")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    if (!client) {
      return errorResponse("Company not found", 404);
    }

    return successResponse({
      ...(client as any),
      siteCount,
      assetCount,
      contactCount,
      userCount,
      users,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const session = await requireAuth();

    if (session.role !== 4 || !session.clientId) {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const { companyName, abn, address, companyLogo } = body;

    const update: Record<string, any> = {};
    if (companyName !== undefined) update.companyName = companyName;
    if (abn !== undefined) update.abn = abn;
    if (address !== undefined) update.address = address;
    if (companyLogo !== undefined) update.companyLogo = companyLogo;

    const client = await Client.findByIdAndUpdate(session.clientId, update, { new: true });
    if (!client) return errorResponse("Company not found", 404);

    return successResponse(client);
  } catch (error) {
    return handleApiError(error);
  }
}
