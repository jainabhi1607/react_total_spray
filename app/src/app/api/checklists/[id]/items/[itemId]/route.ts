import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ChecklistTemplateItem from "@/models/ChecklistTemplateItem";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id, itemId } = await params;

    const body = await req.json();
    const { details, checklistItemType, makeResponseMandatory, orderNo, fileName, fileSize } = body;

    const item = await ChecklistTemplateItem.findOne({
      _id: itemId,
      checklistTemplateId: id,
    });

    if (!item) {
      return errorResponse("Checklist item not found", 404);
    }

    if (details !== undefined) item.details = details;
    if (checklistItemType !== undefined) item.checklistItemType = checklistItemType;
    if (makeResponseMandatory !== undefined) item.makeResponseMandatory = makeResponseMandatory;
    if (orderNo !== undefined) item.orderNo = orderNo;
    if (fileName !== undefined) item.fileName = fileName;
    if (fileSize !== undefined) item.fileSize = fileSize;

    await item.save();

    return successResponse(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id, itemId } = await params;

    const item = await ChecklistTemplateItem.findOneAndDelete({
      _id: itemId,
      checklistTemplateId: id,
    });

    if (!item) {
      return errorResponse("Checklist item not found", 404);
    }

    return successResponse({ message: "Checklist item deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
