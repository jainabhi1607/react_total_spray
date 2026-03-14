import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import JobCardComment from "@/models/JobCardComment";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id, commentId } = await params;

    const body = await req.json();
    const comment = await JobCardComment.findOne({
      _id: commentId,
      jobCardId: id,
    });

    if (!comment) {
      return errorResponse("Comment not found", 404);
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
    await requireAuth();
    const { id, commentId } = await params;

    const comment = await JobCardComment.findOne({
      _id: commentId,
      jobCardId: id,
    });

    if (!comment) {
      return errorResponse("Comment not found", 404);
    }

    await JobCardComment.deleteOne({ _id: commentId });

    return successResponse({ message: "Comment deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
