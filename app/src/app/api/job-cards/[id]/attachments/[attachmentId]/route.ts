import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import JobCardAttachment from "@/models/JobCardAttachment";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id, attachmentId } = await params;

    const attachment = await JobCardAttachment.findOne({
      _id: attachmentId,
      jobCardId: id,
    });

    if (!attachment) {
      return errorResponse("Attachment not found", 404);
    }

    await JobCardAttachment.deleteOne({ _id: attachmentId });

    return successResponse({ message: "Attachment deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
