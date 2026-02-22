import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import AssetMakeModel from "@/models/AssetMakeModel";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id } = await params;

    const mapping = await AssetMakeModel.findById(id);
    if (!mapping) {
      return errorResponse("Asset make-model mapping not found", 404);
    }

    await AssetMakeModel.findByIdAndDelete(id);

    return successResponse({ message: "Asset make-model mapping deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
