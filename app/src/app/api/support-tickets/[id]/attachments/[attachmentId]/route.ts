import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import SupportTicketAttachment from "@/models/SupportTicketAttachment";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id, attachmentId } = await params;

    const body = await req.json();
    const update: Record<string, any> = {};

    if (body.visibility !== undefined) update.visibility = body.visibility;
    if (body.documentName !== undefined) update.documentName = body.documentName;

    const attachment = await SupportTicketAttachment.findOneAndUpdate(
      { _id: attachmentId, supportTicketId: id },
      update,
      { new: true }
    );

    if (!attachment) {
      return errorResponse("Attachment not found", 404);
    }

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
