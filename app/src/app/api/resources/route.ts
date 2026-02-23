import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
  getSearchParams,
  paginatedResponse,
} from "@/lib/api-helpers";
import Resource from "@/models/Resource";
import "@/models/ResourceCategory";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    await requireAuth();
    const { page, limit, skip, search } = getSearchParams(req);

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");

    const query: Record<string, any> = { status: { $ne: 2 } };

    if (categoryId) {
      query.resourceCategoryId = categoryId;
    }

    if (search) {
      query.resourceName = { $regex: search, $options: "i" };
    }

    const [resources, total] = await Promise.all([
      Resource.find(query)
        .populate("resourceCategoryId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Resource.countDocuments(query),
    ]);

    return paginatedResponse(resources, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    await requireAdmin();

    const body = await req.json();
    const { resourceName, resourceCategoryId, thumbnail, resourceFile } = body;

    if (!resourceName) {
      return errorResponse("Resource name is required");
    }

    const resource = await Resource.create({
      resourceName,
      resourceCategoryId,
      thumbnail,
      resourceFile,
      dateTime: new Date(),
      status: 1,
    });

    return successResponse(resource, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
