import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import JobCard from "@/models/JobCard";
import JobCardDetail from "@/models/JobCardDetail";
import JobCardLog from "@/models/JobCardLog";
import { generateUniqueId } from "@/lib/utils";
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

    // Create a new job card from the recurring template
    const lastJobCard = await JobCard.findOne().sort({ ticketNo: -1 }).lean();
    const ticketNo = lastJobCard && (lastJobCard as any).ticketNo
      ? (lastJobCard as any).ticketNo + 1
      : 10000;

    const newJobCard = await JobCard.create({
      ticketNo,
      uniqueId: generateUniqueId(),
      userId: session.id,
      parentId: recurringJob._id,
      clientId: recurringJob.clientId,
      clientSiteId: recurringJob.clientSiteId,
      clientAssetId: recurringJob.clientAssetId,
      clientContactId: recurringJob.clientContactId,
      titleId: recurringJob.titleId,
      jobCardType: recurringJob.jobCardType,
      warranty: recurringJob.warranty,
      jobDate: recurringJob.nextRecurringDate,
      jobCardStatus: 1,
      status: 1,
      dateTime: new Date(),
    });

    // Copy detail from recurring template
    const recurringDetail = await JobCardDetail.findOne({ jobCardId: id }).lean();
    if (recurringDetail) {
      await JobCardDetail.create({
        jobCardId: newJobCard._id,
        description: (recurringDetail as any).description,
        technicianBriefing: (recurringDetail as any).technicianBriefing,
      });
    }

    // Advance the next recurring date
    const nextDate = advanceDate(
      new Date(recurringJob.nextRecurringDate),
      recurringJob.recurringPeriod,
      recurringJob.recurringRange
    );
    recurringJob.nextRecurringDate = nextDate;
    await recurringJob.save();

    // Log
    await JobCardLog.create({
      jobCardId: newJobCard._id,
      userId: session.id,
      task: `Job Card Created from Recurring JC #${recurringJob.ticketNo}`,
      dateTime: new Date(),
    });

    return successResponse(newJobCard, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
