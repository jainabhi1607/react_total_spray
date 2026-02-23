import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import Resource from "@/models/Resource";
import "@/models/ResourceCategory";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id } = await params;

    const resource = await Resource.findById(id)
      .populate("resourceCategoryId")
      .lean();

    if (!resource) {
      return errorResponse("Resource not found", 404);
    }

    return successResponse(resource);
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
    await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const { resourceName, resourceCategoryId, thumbnail, resourceFile, status } = body;

    const resource = await Resource.findById(id);
    if (!resource) {
      return errorResponse("Resource not found", 404);
    }

    if (resourceName !== undefined) resource.resourceName = resourceName;
    if (resourceCategoryId !== undefined) resource.resourceCategoryId = resourceCategoryId;
    if (thumbnail !== undefined) resource.thumbnail = thumbnail;
    if (resourceFile !== undefined) resource.resourceFile = resourceFile;
    if (status !== undefined) resource.status = status;

    await resource.save();

    return successResponse(resource);
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

    const resource = await Resource.findById(id);
    if (!resource) {
      return errorResponse("Resource not found", 404);
    }

    // Soft delete
    resource.status = 2;
    await resource.save();

    return successResponse({ message: "Resource deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
