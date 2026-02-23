import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ChecklistTemplateTag from "@/models/ChecklistTemplateTag";
import "@/models/ChecklistTag";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id } = await params;

    const tags = await ChecklistTemplateTag.find({ checklistTemplateId: id })
      .populate("checklistTagId")
      .lean();

    return successResponse(tags);
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
    await requireAuth();
    const { id } = await params;

    const body = await req.json();
    const { checklistTagId } = body;

    if (!checklistTagId) {
      return errorResponse("Checklist tag ID is required");
    }

    // Check if tag is already assigned
    const existing = await ChecklistTemplateTag.findOne({
      checklistTemplateId: id,
      checklistTagId,
    });
    if (existing) {
      return errorResponse("Tag is already assigned to this template");
    }

    const templateTag = await ChecklistTemplateTag.create({
      checklistTemplateId: id,
      checklistTagId,
      dateTime: new Date(),
    });

    return successResponse(templateTag, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
