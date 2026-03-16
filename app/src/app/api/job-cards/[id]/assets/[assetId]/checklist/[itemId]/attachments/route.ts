import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
  enforcePortalScope,
} from "@/lib/api-helpers";
import JobCard from "@/models/JobCard";
import JobCardAssetChecklistItemAttachment from "@/models/JobCardAssetChecklistItemAttachment";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string; itemId: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id, itemId } = await params;
    const jobCard = await JobCard.findById(id).select("clientId").lean();
    if (!jobCard) return errorResponse("Not found", 404);
    enforcePortalScope(session, (jobCard as any).clientId);

    const attachments = await JobCardAssetChecklistItemAttachment.find({
      jobCardAssetChecklistItemId: itemId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(attachments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string; itemId: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id, itemId } = await params;
    const jobCard = await JobCard.findById(id).select("clientId").lean();
    if (!jobCard) return errorResponse("Not found", 404);
    enforcePortalScope(session, (jobCard as any).clientId);

    const body = await req.json();
    const { documentName, fileName, fileSize } = body;

    const attachment = await JobCardAssetChecklistItemAttachment.create({
      jobCardAssetChecklistItemId: itemId,
      userId: session.id,
      documentName: documentName || fileName,
      fileName,
      fileSize,
      dateTime: new Date(),
      visibility: 1,
    });

    return successResponse(attachment, 201);
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
    const session = await requireAuth();
    const { id, itemId } = await params;
    const jobCard = await JobCard.findById(id).select("clientId").lean();
    if (!jobCard) return errorResponse("Not found", 404);
    enforcePortalScope(session, (jobCard as any).clientId);

    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get("attachmentId");

    if (!attachmentId) {
      return errorResponse("Attachment ID is required");
    }

    const deleted = await JobCardAssetChecklistItemAttachment.findOneAndDelete({
      _id: attachmentId,
      jobCardAssetChecklistItemId: itemId,
    });

    if (!deleted) {
      return errorResponse("Attachment not found", 404);
    }

    return successResponse({ message: "Attachment deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
