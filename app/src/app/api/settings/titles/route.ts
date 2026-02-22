import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import Title from "@/models/Title";

export async function GET() {
  try {
    await dbConnect();
    const titles = await Title.find().sort({ createdAt: -1 }).lean();
    return successResponse(titles);
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

    const newTitle = await Title.create({
      title,
      dateTime: new Date(),
    });

    return successResponse(newTitle, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
