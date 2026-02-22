import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  handleApiError,
} from "@/lib/api-helpers";
import SupportTicketComment from "@/models/SupportTicketComment";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();

    const { id } = await params;

    const comments = await SupportTicketComment.find({ supportTicketId: id })
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
