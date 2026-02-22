import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import JobCard from "@/models/JobCard";
import JobCardLog from "@/models/JobCardLog";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id } = await params;

    const jobCard = await JobCard.findById(id);
    if (!jobCard) {
      return errorResponse("Job card not found", 404);
    }

    jobCard.jobCardSendDate = new Date();
    await jobCard.save();

    // Log the send action
    await JobCardLog.create({
      jobCardId: id,
      userId: session.id,
      task: "Job card marked as sent",
      dateTime: new Date(),
    });

    return successResponse(jobCard);
  } catch (error) {
    return handleApiError(error);
  }
}
