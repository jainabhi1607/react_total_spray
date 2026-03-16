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

    const timeEntries = await SupportTicketTime.find({ supportTicketId: id })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(timeEntries);
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
    const { timeHours, timeMinutes, timeDate, description, timeType } = body;

    const timeEntry = await SupportTicketTime.create({
      supportTicketId: id,
      userId: session.id,
      timeHours,
      timeMinutes,
      timeDate,
      description,
      timeType,
      dateTime: new Date(),
    });

    return successResponse(timeEntry, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
