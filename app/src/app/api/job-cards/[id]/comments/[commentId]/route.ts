import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
  enforcePortalScope,
} from "@/lib/api-helpers";
import JobCard from "@/models/JobCard";
import JobCardComment from "@/models/JobCardComment";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id, commentId } = await params;
    const jobCard = await JobCard.findById(id).select("clientId").lean();
    if (!jobCard) return errorResponse("Not found", 404);
    enforcePortalScope(session, (jobCard as any).clientId);

    const body = await req.json();
    const comment = await JobCardComment.findOne({
      _id: commentId,
      jobCardId: id,
    });

    if (!comment) {
      return errorResponse("Comment not found", 404);
    }

    const isAdmin = [1, 2, 3].includes(session.role);
    if (!isAdmin && String(comment.userId) !== String(session.id)) {
      return errorResponse("Forbidden", 403);
    }

    if (body.comments !== undefined) comment.comments = body.comments;
    if (body.visibility !== undefined) comment.visibility = body.visibility;
    await comment.save();

    return successResponse(comment);
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
    const jobCard = await JobCard.findById(id).select("clientId").lean();
    if (!jobCard) return errorResponse("Not found", 404);
    enforcePortalScope(session, (jobCard as any).clientId);

    const comment = await JobCardComment.findOne({
      _id: commentId,
      jobCardId: id,
    });

    if (!comment) {
      return errorResponse("Comment not found", 404);
    }

    const isAdmin = [1, 2, 3].includes(session.role);
    if (!isAdmin && String(comment.userId) !== String(session.id)) {
      return errorResponse("Forbidden", 403);
    }

    await JobCardComment.deleteOne({ _id: commentId });

    return successResponse({ message: "Comment deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
