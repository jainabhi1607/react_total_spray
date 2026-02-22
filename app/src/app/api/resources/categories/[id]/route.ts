import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ResourceCategory from "@/models/ResourceCategory";
import Resource from "@/models/Resource";

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

    const category = await ResourceCategory.findById(id);
    if (!category) {
      return errorResponse("Category not found", 404);
    }

    if (title !== undefined) category.title = title;

    await category.save();

    return successResponse(category);
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

    const category = await ResourceCategory.findById(id);
    if (!category) {
      return errorResponse("Category not found", 404);
    }

    // Check if any resources use this category
    const resourceCount = await Resource.countDocuments({ resourceCategoryId: id });
    if (resourceCount > 0) {
      return errorResponse(
        `Cannot delete category. ${resourceCount} resource(s) are using this category.`
      );
    }

    await ResourceCategory.findByIdAndDelete(id);

    return successResponse({ message: "Category deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
