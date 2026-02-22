import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import JobCardType from "@/models/JobCardType";

export async function GET() {
  try {
    await dbConnect();
    const jobCardTypes = await JobCardType.find().sort({ createdAt: -1 }).lean();
    return successResponse(jobCardTypes);
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

    const jobCardType = await JobCardType.create({
      title,
      dateTime: new Date(),
    });

    return successResponse(jobCardType, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
