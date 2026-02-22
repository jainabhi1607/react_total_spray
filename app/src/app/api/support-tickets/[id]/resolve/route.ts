import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import SupportTicket from "@/models/SupportTicket";
import SupportTicketDetail from "@/models/SupportTicketDetail";
import SupportTicketLog from "@/models/SupportTicketLog";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();

    const { id } = await params;
    const body = await req.json();
    const { resolvedComments, rootCause, resolution } = body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return errorResponse("Ticket not found", 404);
    }

    // Update ticket status to Resolved (4)
    ticket.ticketStatus = 4;
    await ticket.save();

    // Update ticket detail with resolution info
    await SupportTicketDetail.findOneAndUpdate(
      { supportTicketId: id },
      {
        resolvedComments,
        resolvedDate: new Date(),
        rootCause,
        rootCauseUserId: session.id,
        rootCauseDateTime: new Date(),
        resolution,
        resolutionUserId: session.id,
        resolutionDateTime: new Date(),
      },
      { new: true, upsert: true }
    );

    // Log the resolution
    await SupportTicketLog.create({
      supportTicketId: id,
      userId: session.id,
      task: "Ticket resolved",
      dateTime: new Date(),
    });

    return successResponse(ticket);
  } catch (error) {
    return handleApiError(error);
  }
}
