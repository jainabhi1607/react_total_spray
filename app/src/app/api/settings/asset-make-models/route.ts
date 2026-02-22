import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import AssetMakeModel from "@/models/AssetMakeModel";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const assetMakeId = searchParams.get("assetMakeId");

    const query: Record<string, any> = {};
    if (assetMakeId) {
      query.assetMakeId = assetMakeId;
    }

    const mappings = await AssetMakeModel.find(query)
      .populate("assetMakeId")
      .populate("assetModelId")
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(mappings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    await requireAdmin();

    const body = await req.json();
    const { assetMakeId, assetModelId } = body;

    if (!assetMakeId || !assetModelId) {
      return errorResponse("Asset make ID and asset model ID are required");
    }

    const mapping = await AssetMakeModel.create({
      assetMakeId,
      assetModelId,
      dateTime: new Date(),
    });

    return successResponse(mapping, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
