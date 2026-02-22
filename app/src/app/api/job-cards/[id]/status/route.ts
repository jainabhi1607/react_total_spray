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
import { JOB_CARD_STATUS_LABELS } from "@/lib/utils";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id } = await params;

    const body = await req.json();
    const { jobCardStatus } = body;

    if (jobCardStatus === undefined) {
      return errorResponse("jobCardStatus is required");
    }

    const jobCard = await JobCard.findById(id);
    if (!jobCard) {
      return errorResponse("Job card not found", 404);
    }

    const oldStatus = jobCard.jobCardStatus;
    jobCard.jobCardStatus = jobCardStatus;
    await jobCard.save();

    const oldLabel = JOB_CARD_STATUS_LABELS[oldStatus as number] || String(oldStatus);
    const newLabel = JOB_CARD_STATUS_LABELS[jobCardStatus] || String(jobCardStatus);

    // Log the status change
    await JobCardLog.create({
      jobCardId: id,
      userId: session.id,
      task: `Job card status changed from ${oldLabel} to ${newLabel}`,
      dateTime: new Date(),
    });

    return successResponse(jobCard);
  } catch (error) {
    return handleApiError(error);
  }
}
