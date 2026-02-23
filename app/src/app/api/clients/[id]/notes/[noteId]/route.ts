import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ClientNote from "@/models/ClientNote";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id, noteId } = await params;

    const body = await req.json();
    const { notes, noteType } = body;

    const update: Record<string, unknown> = {};
    if (notes !== undefined) update.notes = notes;
    if (noteType !== undefined) update.noteType = noteType;

    const note = await ClientNote.findOneAndUpdate(
      { _id: noteId, clientId: id },
      { $set: update },
      { new: true }
    );

    if (!note) return errorResponse("Note not found", 404);

    return successResponse(note);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id, noteId } = await params;

    const note = await ClientNote.findOneAndDelete({
      _id: noteId,
      clientId: id,
    });

    if (!note) return errorResponse("Note not found", 404);

    return successResponse({ message: "Note deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
