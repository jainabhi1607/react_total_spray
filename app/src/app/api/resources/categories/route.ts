import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ResourceCategory from "@/models/ResourceCategory";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    await requireAuth();

    const categories = await ResourceCategory.find()
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    await requireAuth();

    const body = await req.json();
    const { title } = body;

    if (!title) {
      return errorResponse("Title is required");
    }

    const category = await ResourceCategory.create({
      title,
      dateTime: new Date(),
    });

    return successResponse(category, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
