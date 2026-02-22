import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import AssetModel from "@/models/AssetModel";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const { title, assetTypeId } = body;

    const assetModel = await AssetModel.findById(id);
    if (!assetModel) {
      return errorResponse("Asset model not found", 404);
    }

    if (title !== undefined) assetModel.title = title;
    if (assetTypeId !== undefined) assetModel.assetTypeId = assetTypeId;
    await assetModel.save();

    return successResponse(assetModel);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id } = await params;

    const assetModel = await AssetModel.findById(id);
    if (!assetModel) {
      return errorResponse("Asset model not found", 404);
    }

    await AssetModel.findByIdAndDelete(id);

    return successResponse({ message: "Asset model deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
