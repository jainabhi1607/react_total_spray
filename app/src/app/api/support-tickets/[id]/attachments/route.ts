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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();

    const { id } = await params;

    const ticket = await SupportTicket.findById(id).select("clientId").lean();
    if (!ticket) return errorResponse("Not found", 404);
    enforcePortalScope(session, (ticket as any).clientId);

    const attachQuery: Record<string, any> = { supportTicketId: id };
    // Portal users only see public attachments
    if ([4, 6].includes(session.role)) {
      attachQuery.visibility = 2;
    }

    const attachments = await SupportTicketAttachment.find(attachQuery)
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(attachments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();

    const { id } = await params;

    const ticketForScope = await SupportTicket.findById(id).select("clientId").lean();
    if (!ticketForScope) return errorResponse("Not found", 404);
    enforcePortalScope(session, (ticketForScope as any).clientId);

    const body = await req.json();

    if (body.visibility !== undefined) {
      await SupportTicketAttachment.updateMany(
        { supportTicketId: id },
        { visibility: body.visibility }
      );
    }

    const attachments = await SupportTicketAttachment.find({
      supportTicketId: id,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();

    const { id } = await params;

    const ticketForPost = await SupportTicket.findById(id).select("clientId").lean();
    if (!ticketForPost) return errorResponse("Not found", 404);
    enforcePortalScope(session, (ticketForPost as any).clientId);

    const body = await req.json();
    const { documentName, fileName, fileSize, visibility } = body;

    const attachment = await SupportTicketAttachment.create({
      supportTicketId: id,
      userId: session.id,
      documentName,
      fileName,
      fileSize,
      visibility,
      dateTime: new Date(),
    });

    return successResponse(attachment, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
