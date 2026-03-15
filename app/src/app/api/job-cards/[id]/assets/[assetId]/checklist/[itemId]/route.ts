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
  { params }: { params: Promise<{ id: string; assetId: string; itemId: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { assetId, itemId } = await params;

    const body = await req.json();

    const allowedFields = [
      "details", "checklistItemType", "makeResponseMandatory",
      "fileName", "fileSize", "fileRealName",
      "responseType1", "responseType2", "comments",
      "signature", "signatureDateTime", "setDateTime",
      "markAsDone",
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    const updated = await JobCardAssetChecklistItem.findOneAndUpdate(
      { _id: itemId, jobCardClientAssetId: assetId },
      updateData,
      { new: true }
    );

    if (!updated) {
      return errorResponse("Checklist item not found", 404);
    }

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string; itemId: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { assetId, itemId } = await params;

    const deleted = await JobCardAssetChecklistItem.findOneAndDelete({
      _id: itemId,
      jobCardClientAssetId: assetId,
    });

    if (!deleted) {
      return errorResponse("Checklist item not found", 404);
    }

    return successResponse({ message: "Checklist item deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
