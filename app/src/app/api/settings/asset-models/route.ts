import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import AssetModel from "@/models/AssetModel";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const assetTypeId = searchParams.get("assetTypeId");

    const query: Record<string, any> = {};
    if (assetTypeId) {
      query.assetTypeId = assetTypeId;
    }

    const assetModels = await AssetModel.find(query)
      .sort({ title: 1 })
      .lean();

    return successResponse(assetModels);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    await requireAdmin();

    const body = await req.json();
    const { title, assetTypeId } = body;

    if (!title) {
      return errorResponse("Title is required");
    }

    const assetModel = await AssetModel.create({
      title,
      assetTypeId: assetTypeId || undefined,
      dateTime: new Date(),
    });

    return successResponse(assetModel, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
