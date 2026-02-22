import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import JobCardClientAsset from "@/models/JobCardClientAsset";
import JobCardAssetChecklistItem from "@/models/JobCardAssetChecklistItem";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id, assetId } = await params;

    const clientAsset = await JobCardClientAsset.findOne({
      _id: assetId,
      jobCardId: id,
    })
      .populate("clientAssetId")
      .lean();

    if (!clientAsset) {
      return errorResponse("Job card asset not found", 404);
    }

    const checklistItems = await JobCardAssetChecklistItem.find({
      jobCardClientAssetId: assetId,
    })
      .sort({ orderNo: 1 })
      .lean();

    return successResponse({ ...clientAsset, checklistItems });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id, assetId } = await params;

    const clientAsset = await JobCardClientAsset.findOne({
      _id: assetId,
      jobCardId: id,
    });

    if (!clientAsset) {
      return errorResponse("Job card asset not found", 404);
    }

    // Soft delete
    clientAsset.status = 2;
    await clientAsset.save();

    return successResponse({ message: "Asset removed from job card successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
