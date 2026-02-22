import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import Title from "@/models/Title";

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

    const existing = await Title.findById(id);
    if (!existing) {
      return errorResponse("Title not found", 404);
    }

    if (title !== undefined) existing.title = title;
    await existing.save();

    return successResponse(existing);
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

    const existing = await Title.findById(id);
    if (!existing) {
      return errorResponse("Title not found", 404);
    }

    await Title.findByIdAndDelete(id);

    return successResponse({ message: "Title deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
