import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import JobCardAssetChecklistItem from "@/models/JobCardAssetChecklistItem";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { assetId } = await params;

    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse("Items array is required");
    }

    await Promise.all(
      items.map((item: { id: string; orderNo: number }) =>
        JobCardAssetChecklistItem.findOneAndUpdate(
          { _id: item.id, jobCardClientAssetId: assetId },
          { orderNo: item.orderNo }
        )
      )
    );

    return successResponse({ message: "Reordered successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
