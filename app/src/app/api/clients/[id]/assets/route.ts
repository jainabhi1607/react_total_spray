import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ClientAsset from "@/models/ClientAsset";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id } = await params;

    // Client users can only view their own client's assets
    if ([4, 6].includes(session.role)) {
      if (session.clientId !== id) {
        return errorResponse("Forbidden", 403);
      }
    }

    const query: Record<string, any> = {
      clientId: id,
      status: { $ne: 2 },
    };

    // Optional siteId filter via query param
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    if (siteId) {
      query.clientSiteId = siteId;
    }

    const assets = await ClientAsset.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(assets);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const {
      machineName,
      serialNo,
      clientSiteId,
      assetTypeId,
      assetMakeId,
      assetModelId,
      notes,
    } = body;

    if (!machineName) {
      return errorResponse("Machine name is required");
    }

    const asset = await ClientAsset.create({
      clientId: id,
      machineName,
      serialNo,
      clientSiteId,
      assetTypeId,
      assetMakeId,
      assetModelId,
      notes,
      dateTime: new Date(),
      status: 1,
    });

    return successResponse(asset, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
