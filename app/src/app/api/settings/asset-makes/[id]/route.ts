import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import AssetMake from "@/models/AssetMake";

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

    const assetMake = await AssetMake.findById(id);
    if (!assetMake) {
      return errorResponse("Asset make not found", 404);
    }

    if (title !== undefined) assetMake.title = title;
    await assetMake.save();

    return successResponse(assetMake);
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

    const assetMake = await AssetMake.findById(id);
    if (!assetMake) {
      return errorResponse("Asset make not found", 404);
    }

    await AssetMake.findByIdAndDelete(id);

    return successResponse({ message: "Asset make deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
