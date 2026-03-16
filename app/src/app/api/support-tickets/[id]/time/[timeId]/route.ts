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
import SupportTicketTime from "@/models/SupportTicketTime";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; timeId: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();

    const { id, timeId } = await params;

    const ticket = await SupportTicket.findById(id).select("clientId").lean();
    if (!ticket) return errorResponse("Not found", 404);
    enforcePortalScope(session, (ticket as any).clientId);

    const body = await req.json();

    const timeEntry = await SupportTicketTime.findByIdAndUpdate(
      timeId,
      body,
      { new: true, runValidators: true }
    );

    if (!timeEntry) {
      return errorResponse("Time entry not found", 404);
    }

    return successResponse(timeEntry);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; timeId: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();

    const { id, timeId } = await params;

    const ticketForScope = await SupportTicket.findById(id).select("clientId").lean();
    if (!ticketForScope) return errorResponse("Not found", 404);
    enforcePortalScope(session, (ticketForScope as any).clientId);

    const timeEntry = await SupportTicketTime.findByIdAndDelete(timeId);

    if (!timeEntry) {
      return errorResponse("Time entry not found", 404);
    }

    return successResponse({ message: "Time entry deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
