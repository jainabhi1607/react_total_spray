import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ChecklistTemplate from "@/models/ChecklistTemplate";
import ChecklistTemplateItem from "@/models/ChecklistTemplateItem";
import ChecklistTemplateTag from "@/models/ChecklistTemplateTag";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id } = await params;

    const template = await ChecklistTemplate.findById(id)
      .populate("userId", "name")
      .lean();

    if (!template) {
      return errorResponse("Checklist template not found", 404);
    }

    const [items, tags] = await Promise.all([
      ChecklistTemplateItem.find({ checklistTemplateId: id })
        .sort({ orderNo: 1 })
        .lean(),
      ChecklistTemplateTag.find({ checklistTemplateId: id })
        .populate("checklistTagId")
        .lean(),
    ]);

    return successResponse({
      ...template,
      items,
      tags,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

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

    const template = await ChecklistTemplate.findById(id);
    if (!template) {
      return errorResponse("Checklist template not found", 404);
    }

    if (title !== undefined) template.title = title;

    await template.save();

    return successResponse(template);
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

    const template = await ChecklistTemplate.findById(id);
    if (!template) {
      return errorResponse("Checklist template not found", 404);
    }

    // Hard delete template and all associated items and tags
    await Promise.all([
      ChecklistTemplateItem.deleteMany({ checklistTemplateId: id }),
      ChecklistTemplateTag.deleteMany({ checklistTemplateId: id }),
      ChecklistTemplate.findByIdAndDelete(id),
    ]);

    return successResponse({ message: "Checklist template deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
