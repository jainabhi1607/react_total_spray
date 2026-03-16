import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import JobCardAttachment from "@/models/JobCardAttachment";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id, attachmentId } = await params;

    const body = await req.json();
    const attachment = await JobCardAttachment.findOne({
      _id: attachmentId,
      jobCardId: id,
    });

    if (!attachment) {
      return errorResponse("Attachment not found", 404);
    }

    const isAdmin = [1, 2, 3].includes(session.role);
    if (!isAdmin && String(attachment.userId) !== String(session.id)) {
      return errorResponse("Forbidden", 403);
    }

    if (body.visibility !== undefined) attachment.visibility = body.visibility;
    if (body.documentName !== undefined) attachment.documentName = body.documentName;
    await attachment.save();

    return successResponse(attachment);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id, attachmentId } = await params;

    const attachment = await JobCardAttachment.findOne({
      _id: attachmentId,
      jobCardId: id,
    });

    if (!attachment) {
      return errorResponse("Attachment not found", 404);
    }

    const isAdmin = [1, 2, 3].includes(session.role);
    if (!isAdmin && String(attachment.userId) !== String(session.id)) {
      return errorResponse("Forbidden", 403);
    }

    await JobCardAttachment.deleteOne({ _id: attachmentId });

    return successResponse({ message: "Attachment deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
