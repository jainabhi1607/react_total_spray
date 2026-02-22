import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import JobCardComment from "@/models/JobCardComment";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id } = await params;

    const comments = await JobCardComment.find({ jobCardId: id })
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

    const body = await req.json();
    const { comments, commentType, visibility } = body;

    if (!comments) {
      return errorResponse("Comment text is required");
    }

    const comment = await JobCardComment.create({
      jobCardId: id,
      userId: session.id,
      comments,
      commentType,
      visibility,
      dateTime: new Date(),
    });

    return successResponse(comment, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
