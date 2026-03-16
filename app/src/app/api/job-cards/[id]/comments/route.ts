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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id } = await params;
    const jobCard = await JobCard.findById(id).select("clientId").lean();
    if (!jobCard) return errorResponse("Not found", 404);
    enforcePortalScope(session, (jobCard as any).clientId);

    const commentQuery: Record<string, any> = { jobCardId: id };
    // Portal users only see public comments
    if ([4, 6].includes(session.role)) {
      commentQuery.visibility = 2;
    }

    const comments = await JobCardComment.find(commentQuery)
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
    const jobCard = await JobCard.findById(id).select("clientId").lean();
    if (!jobCard) return errorResponse("Not found", 404);
    enforcePortalScope(session, (jobCard as any).clientId);

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
