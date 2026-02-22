import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import JobCardAssetChecklistItem from "@/models/JobCardAssetChecklistItem";
import JobCardClientAsset from "@/models/JobCardClientAsset";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { assetId } = await params;

    const checklistItems = await JobCardAssetChecklistItem.find({
      jobCardClientAssetId: assetId,
    })
      .sort({ orderNo: 1 })
      .lean();

    return successResponse(checklistItems);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { assetId } = await params;

    const body = await req.json();
    const {
      details,
      checklistItemType,
      makeResponseMandatory,
      orderNo,
      fileName,
      fileSize,
    } = body;

    // Verify the job card client asset exists
    const clientAsset = await JobCardClientAsset.findById(assetId);
    if (!clientAsset) {
      return errorResponse("Job card asset not found", 404);
    }

    const checklistItem = await JobCardAssetChecklistItem.create({
      jobCardClientAssetId: assetId,
      userId: session.id,
      details,
      checklistItemType,
      makeResponseMandatory,
      orderNo,
      fileName,
      fileSize,
      setDateTime: new Date(),
    });

    return successResponse(checklistItem, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

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

    // Batch update checklist item responses
    const updatePromises = items.map(async (item: any) => {
      const {
        itemId,
        responseType1,
        responseType2,
        comments,
        markAsDone,
        signature,
        signatureDateTime,
      } = item;

      if (!itemId) return null;

      const updateData: Record<string, any> = {};
      if (responseType1 !== undefined) updateData.responseType1 = responseType1;
      if (responseType2 !== undefined) updateData.responseType2 = responseType2;
      if (comments !== undefined) updateData.comments = comments;
      if (markAsDone !== undefined) updateData.markAsDone = markAsDone;
      if (signature !== undefined) updateData.signature = signature;
      if (signatureDateTime !== undefined) updateData.signatureDateTime = signatureDateTime;

      return JobCardAssetChecklistItem.findOneAndUpdate(
        { _id: itemId, jobCardClientAssetId: assetId },
        updateData,
        { new: true }
      );
    });

    const results = await Promise.all(updatePromises);
    const updatedItems = results.filter(Boolean);

    return successResponse(updatedItems);
  } catch (error) {
    return handleApiError(error);
  }
}
