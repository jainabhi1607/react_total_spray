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
import SupportTicketComment from "@/models/SupportTicketComment";

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

    const commentQuery: Record<string, any> = { supportTicketId: id };
    // Portal users only see public comments
    if ([4, 6].includes(session.role)) {
      commentQuery.visibility = 2;
    }

    const comments = await SupportTicketComment.find(commentQuery)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(comments);
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

    const ticketForScope = await SupportTicket.findById(id).select("clientId").lean();
    if (!ticketForScope) return errorResponse("Not found", 404);
    enforcePortalScope(session, (ticketForScope as any).clientId);

    const body = await req.json();
    const { comments, commentType, visibility } = body;

    const comment = await SupportTicketComment.create({
      supportTicketId: id,
      comments,
      commentType,
      visibility,
      userId: session.id,
      dateTime: new Date(),
    });

    return successResponse(comment, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
