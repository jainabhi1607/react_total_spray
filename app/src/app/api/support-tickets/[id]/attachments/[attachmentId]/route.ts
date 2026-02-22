import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import SupportTicketAttachment from "@/models/SupportTicketAttachment";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();

    const { attachmentId } = await params;

    const attachment =
      await SupportTicketAttachment.findByIdAndDelete(attachmentId);

    if (!attachment) {
      return errorResponse("Attachment not found", 404);
    }

    return successResponse({ message: "Attachment deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
