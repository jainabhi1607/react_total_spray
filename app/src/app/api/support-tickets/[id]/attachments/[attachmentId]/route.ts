import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
  enforcePortalScope,
} from "@/lib/api-helpers";
import SupportTicket from "@/models/SupportTicket";
import SupportTicketAttachment from "@/models/SupportTicketAttachment";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id, attachmentId } = await params;

    const ticket = await SupportTicket.findById(id).select("clientId").lean();
    if (!ticket) return errorResponse("Not found", 404);
    enforcePortalScope(session, (ticket as any).clientId);

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
    const session = await requireAuth();

    const { id, attachmentId } = await params;

    const ticketForScope = await SupportTicket.findById(id).select("clientId").lean();
    if (!ticketForScope) return errorResponse("Not found", 404);
    enforcePortalScope(session, (ticketForScope as any).clientId);

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
