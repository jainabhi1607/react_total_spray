import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ChecklistTemplateItem from "@/models/ChecklistTemplateItem";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id } = await params;

    const items = await ChecklistTemplateItem.find({ checklistTemplateId: id })
      .sort({ orderNo: 1 })
      .lean();

    return successResponse(items);
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
    const { details, checklistItemType, makeResponseMandatory, orderNo, fileName, fileSize } = body;

    const item = await ChecklistTemplateItem.create({
      checklistTemplateId: id,
      details,
      checklistItemType,
      makeResponseMandatory,
      orderNo,
      fileName,
      fileSize,
    });

    return successResponse(item, 201);
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
    // id from params is the checklistTemplateId (not used directly but validates route)
    await params;

    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return errorResponse("Items must be an array of { id, orderNo }");
    }

    // Batch update item order
    const updateOperations = items.map((item: { id: string; orderNo: number }) =>
      ChecklistTemplateItem.findByIdAndUpdate(
        item.id,
        { orderNo: item.orderNo },
        { new: true }
      )
    );

    await Promise.all(updateOperations);

    return successResponse({ message: "Item order updated successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
