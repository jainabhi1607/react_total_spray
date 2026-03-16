import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { successResponse, handleApiError } from "@/lib/api-helpers";
import JobCard from "@/models/JobCard";
import JobCardDetail from "@/models/JobCardDetail";
import JobCardLog from "@/models/JobCardLog";
import { generateUniqueId } from "@/lib/utils";
import { advanceDate } from "@/lib/recurring-utils";

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    await dbConnect();

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Find all auto-approved recurring jobs where next date has arrived
    const recurringJobs = await JobCard.find({
      recurringJob: 1,
      contractApprove: 1,
      status: { $ne: 2 },
      nextRecurringDate: { $lte: today },
      recurringPeriod: { $exists: true },
      recurringRange: { $exists: true },
    }).lean();

    let created = 0;

    for (const recurring of recurringJobs as any[]) {
      // Auto-generate ticketNo
      const lastJobCard = await JobCard.findOne().sort({ ticketNo: -1 }).lean();
      const ticketNo = lastJobCard && (lastJobCard as any).ticketNo
        ? (lastJobCard as any).ticketNo + 1
        : 10000;

      // Create new job card from recurring template
      const newJobCard = await JobCard.create({
        ticketNo,
        uniqueId: generateUniqueId(),
        userId: recurring.userId,
        parentId: recurring._id,
        clientId: recurring.clientId,
        clientSiteId: recurring.clientSiteId,
        clientAssetId: recurring.clientAssetId,
        clientContactId: recurring.clientContactId,
        titleId: recurring.titleId,
        jobCardType: recurring.jobCardType,
        warranty: recurring.warranty,
        jobDate: recurring.nextRecurringDate,
        jobCardStatus: 1,
        status: 1,
        dateTime: new Date(),
      });

      // Copy detail
      const detail = await JobCardDetail.findOne({ jobCardId: recurring._id }).lean();
      if (detail) {
        await JobCardDetail.create({
          jobCardId: newJobCard._id,
          description: (detail as any).description,
          technicianBriefing: (detail as any).technicianBriefing,
        });
      }

      // Advance next recurring date
      const nextDate = advanceDate(
        new Date(recurring.nextRecurringDate),
        recurring.recurringPeriod,
        recurring.recurringRange
      );
      await JobCard.findByIdAndUpdate(recurring._id, {
        nextRecurringDate: nextDate,
      });

      // Log
      await JobCardLog.create({
        jobCardId: newJobCard._id,
        userId: recurring.userId,
        task: `Job Card auto-created from Recurring JC #${recurring.ticketNo}`,
        dateTime: new Date(),
      });

      created++;
    }

    return successResponse({ processed: recurringJobs.length, created });
  } catch (error) {
    return handleApiError(error);
  }
}
