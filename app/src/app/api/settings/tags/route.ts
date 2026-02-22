import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import Tag from "@/models/Tag";

export async function GET() {
  try {
    await dbConnect();
    const tags = await Tag.find().sort({ createdAt: -1 }).lean();
    return successResponse(tags);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    await requireAdmin();

    const body = await req.json();
    const { title } = body;

    if (!title) {
      return errorResponse("Title is required");
    }

    const tag = await Tag.create({
      title,
      dateTime: new Date(),
    });

    return successResponse(tag, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
