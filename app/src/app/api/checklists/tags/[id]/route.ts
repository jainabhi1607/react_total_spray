import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ChecklistTag from "@/models/ChecklistTag";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id } = await params;

    const body = await req.json();
    const { title } = body;

    const tag = await ChecklistTag.findById(id);
    if (!tag) {
      return errorResponse("Checklist tag not found", 404);
    }

    if (title !== undefined) tag.title = title;
    await tag.save();

    return successResponse(tag);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id } = await params;

    const tag = await ChecklistTag.findById(id);
    if (!tag) {
      return errorResponse("Checklist tag not found", 404);
    }

    await ChecklistTag.findByIdAndDelete(id);

    return successResponse({ message: "Checklist tag deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
