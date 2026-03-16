import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
  enforcePortalScope,
} from "@/lib/api-helpers";
import SupportTicketOwner from "@/models/SupportTicketOwner";
import SupportTicket from "@/models/SupportTicket";

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

    const owners = await SupportTicketOwner.find({ supportTicketId: id })
      .populate("userId", "name lastName email")
      .lean();

    return successResponse(owners);
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
    const { userId } = body;

    const owner = await SupportTicketOwner.create({
      supportTicketId: id,
      userId,
      addedBy: session.id,
      dateTime: new Date(),
    });

    return successResponse(owner, 201);
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

    const ticketForPut = await SupportTicket.findById(id).select("clientId").lean();
    if (!ticketForPut) return errorResponse("Not found", 404);
    enforcePortalScope(session, (ticketForPut as any).clientId);

    const { userIds } = await req.json();

    // Remove all existing owners
    await SupportTicketOwner.deleteMany({ supportTicketId: id });

    // Create new owners
    const owners = await SupportTicketOwner.insertMany(
      userIds.map((userId: string) => ({
        supportTicketId: id,
        userId,
        addedBy: session.id,
        dateTime: new Date(),
      }))
    );

    // Update ticket userId to first selected owner and set Working status if currently Open
    if (userIds.length > 0) {
      const ticket = await SupportTicket.findById(id);
      if (ticket) {
        const update: Record<string, any> = { userId: userIds[0] };
        // Only change to Working (2) if currently Open (1)
        if (ticket.ticketStatus === 1) {
          update.ticketStatus = 2;
        }
        await SupportTicket.findByIdAndUpdate(id, update);
      }
    }

    return successResponse(owners);
  } catch (error) {
    return handleApiError(error);
  }
}
