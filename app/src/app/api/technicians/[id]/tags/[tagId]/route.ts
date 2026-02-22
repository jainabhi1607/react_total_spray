import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import TechnicianTag from "@/models/TechnicianTag";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id, tagId } = await params;

    const tag = await TechnicianTag.findOneAndDelete({
      technicianId: id,
      tagId,
    });

    if (!tag) {
      return errorResponse("Tag not found on this technician", 404);
    }

    return successResponse({ message: "Tag removed from technician successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
