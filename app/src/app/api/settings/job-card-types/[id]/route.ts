import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import JobCardType from "@/models/JobCardType";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const { title } = body;

    const jobCardType = await JobCardType.findById(id);
    if (!jobCardType) {
      return errorResponse("Job card type not found", 404);
    }

    if (title !== undefined) jobCardType.title = title;
    await jobCardType.save();

    return successResponse(jobCardType);
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

    const jobCardType = await JobCardType.findById(id);
    if (!jobCardType) {
      return errorResponse("Job card type not found", 404);
    }

    await JobCardType.findByIdAndDelete(id);

    return successResponse({ message: "Job card type deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
