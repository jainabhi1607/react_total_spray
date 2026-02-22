import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ClientNote from "@/models/ClientNote";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id } = await params;

    // Client users can only view their own client's notes
    if ([4, 6].includes(session.role)) {
      if (session.clientId !== id) {
        return errorResponse("Forbidden", 403);
      }
    }

    const notes = await ClientNote.find({ clientId: id })
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(notes);
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
    const session = await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const { notes, noteType } = body;

    if (!notes) {
      return errorResponse("Notes content is required");
    }

    const note = await ClientNote.create({
      clientId: id,
      notes,
      noteType,
      userId: session.id,
      dateTime: new Date(),
    });

    return successResponse(note, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
