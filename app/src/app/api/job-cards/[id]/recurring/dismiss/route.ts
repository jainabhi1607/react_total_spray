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
import { advanceDate } from "@/lib/recurring-utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id } = await params;

    const recurringJob = await JobCard.findById(id);
    if (!recurringJob || recurringJob.recurringJob !== 1) {
      return errorResponse("Recurring job not found", 404);
    }

    if (!recurringJob.nextRecurringDate || !recurringJob.recurringPeriod || !recurringJob.recurringRange) {
      return errorResponse("Recurring details not set");
    }

    // Advance next recurring date by one period (skip current)
    const nextDate = advanceDate(
      new Date(recurringJob.nextRecurringDate),
      recurringJob.recurringPeriod,
      recurringJob.recurringRange
    );
    recurringJob.nextRecurringDate = nextDate;
    await recurringJob.save();

    // Log
    await JobCardLog.create({
      jobCardId: id,
      userId: session.id,
      task: `Recurring date dismissed. Next date: ${nextDate.toLocaleDateString()}`,
      dateTime: new Date(),
    });

    return successResponse({ nextRecurringDate: nextDate });
  } catch (error) {
    return handleApiError(error);
  }
}
