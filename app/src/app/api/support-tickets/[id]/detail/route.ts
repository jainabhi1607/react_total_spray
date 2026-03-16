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
import SupportTicketDetail from "@/models/SupportTicketDetail";

export async function PUT(
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

    const body = await req.json();

    const updateData: Record<string, any> = {};

    if (body.description !== undefined) updateData.description = body.description;
    if (body.rootCause !== undefined) {
      updateData.rootCause = body.rootCause;
      updateData.rootCauseUserId = session.id;
      updateData.rootCauseDateTime = new Date();
    }
    if (body.resolution !== undefined) {
      updateData.resolution = body.resolution;
      updateData.resolutionUserId = session.id;
      updateData.resolutionDateTime = new Date();
    }
    if (body.resolvedComments !== undefined) {
      updateData.resolvedComments = body.resolvedComments;
      updateData.resolvedDate = new Date();
    }

    const detail = await SupportTicketDetail.findOneAndUpdate(
      { supportTicketId: id },
      updateData,
      { upsert: true, new: true }
    );

    return successResponse(detail);
  } catch (error) {
    return handleApiError(error);
  }
}
