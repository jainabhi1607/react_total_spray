import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import Tag from "@/models/Tag";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const { title } = body;

    const tag = await Tag.findById(id);
    if (!tag) {
      return errorResponse("Tag not found", 404);
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
    await requireAdmin();
    const { id } = await params;

    const tag = await Tag.findById(id);
    if (!tag) {
      return errorResponse("Tag not found", 404);
    }

    await Tag.findByIdAndDelete(id);

    return successResponse({ message: "Tag deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
