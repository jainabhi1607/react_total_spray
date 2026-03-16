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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id, commentId } = await params;

    const ticket = await SupportTicket.findById(id).select("clientId").lean();
    if (!ticket) return errorResponse("Not found", 404);
    enforcePortalScope(session, (ticket as any).clientId);

    const comment = await SupportTicketComment.findOne({
      _id: commentId,
      supportTicketId: id,
    });

    if (!comment) {
      return errorResponse("Comment not found", 404);
    }

    // Admin (role 1,2,3) can edit any comment; others can only edit their own
    const isAdmin = [1, 2, 3].includes(session.role);
    if (!isAdmin && String(comment.userId) !== session.id) {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const update: Record<string, any> = {};

    if (body.comments !== undefined) update.comments = body.comments;
    if (body.visibility !== undefined) update.visibility = body.visibility;

    const updated = await SupportTicketComment.findByIdAndUpdate(
      commentId,
      update,
      { new: true }
    );

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id, commentId } = await params;

    const ticketForScope = await SupportTicket.findById(id).select("clientId").lean();
    if (!ticketForScope) return errorResponse("Not found", 404);
    enforcePortalScope(session, (ticketForScope as any).clientId);

    const comment = await SupportTicketComment.findOne({
      _id: commentId,
      supportTicketId: id,
    });

    if (!comment) {
      return errorResponse("Comment not found", 404);
    }

    // Admin (role 1,2,3) can delete any comment; others can only delete their own
    const isAdmin = [1, 2, 3].includes(session.role);
    if (!isAdmin && String(comment.userId) !== session.id) {
      return errorResponse("Forbidden", 403);
    }

    await SupportTicketComment.findByIdAndDelete(commentId);

    return successResponse({ message: "Comment deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
