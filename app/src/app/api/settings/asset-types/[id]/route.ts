import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import AssetType from "@/models/AssetType";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const { title } = body;

    const assetType = await AssetType.findById(id);
    if (!assetType) {
      return errorResponse("Asset type not found", 404);
    }

    if (title !== undefined) assetType.title = title;
    await assetType.save();

    return successResponse(assetType);
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

    const assetType = await AssetType.findById(id);
    if (!assetType) {
      return errorResponse("Asset type not found", 404);
    }

    await AssetType.findByIdAndDelete(id);

    return successResponse({ message: "Asset type deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
