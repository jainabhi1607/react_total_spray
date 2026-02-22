import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ChecklistTemplateTag from "@/models/ChecklistTemplateTag";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id, tagId } = await params;

    const tag = await ChecklistTemplateTag.findOneAndDelete({
      checklistTemplateId: id,
      checklistTagId: tagId,
    });

    if (!tag) {
      return errorResponse("Tag not found on this template", 404);
    }

    return successResponse({ message: "Tag removed from template successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
