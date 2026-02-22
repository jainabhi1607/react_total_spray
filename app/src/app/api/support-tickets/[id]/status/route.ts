import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import SupportTicket from "@/models/SupportTicket";
import SupportTicketLog from "@/models/SupportTicketLog";

const STATUS_LABELS: Record<number, string> = {
  1: "Open",
  2: "In Progress",
  3: "On Hold",
  4: "Resolved",
  5: "Closed",
};

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();

    const { id } = await params;
    const body = await req.json();
    const { ticketStatus } = body;

    if (ticketStatus === undefined) {
      return errorResponse("ticketStatus is required");
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { ticketStatus },
      { new: true }
    );

    if (!ticket) {
      return errorResponse("Ticket not found", 404);
    }

    const statusLabel = STATUS_LABELS[ticketStatus] || `Status ${ticketStatus}`;

    await SupportTicketLog.create({
      supportTicketId: id,
      userId: session.id,
      task: `Ticket status changed to ${statusLabel}`,
      dateTime: new Date(),
    });

    return successResponse(ticket);
  } catch (error) {
    return handleApiError(error);
  }
}
