import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
  getSearchParams,
  paginatedResponse,
} from "@/lib/api-helpers";
import JobCard from "@/models/JobCard";
import JobCardDetail from "@/models/JobCardDetail";
import JobCardLog from "@/models/JobCardLog";
import { generateUniqueId } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { page, limit, skip, search, status } = getSearchParams(req);

    const query: Record<string, any> = {};

    // Client users can only see their own job cards
    if ([4, 6].includes(session.role)) {
      if (!session.clientId) {
        return errorResponse("No client associated with this account", 403);
      }
      query.clientId = session.clientId;
    }

    // Search by ticketNo or description
    if (search) {
      const searchNum = parseInt(search);
      if (!isNaN(searchNum)) {
        query.$or = [
          { ticketNo: searchNum },
        ];
      } else {
        query.$or = [
          { uniqueId: { $regex: search, $options: "i" } },
        ];
      }
    }

    // Filter by status (record status)
    if (status !== undefined) {
      query.status = status;
    } else {
      query.status = { $ne: 2 };
    }

    // Filter by jobCardStatus
    const { searchParams } = new URL(req.url);
    const jobCardStatus = searchParams.get("jobCardStatus");
    if (jobCardStatus) {
      query.jobCardStatus = parseInt(jobCardStatus);
    }

    const [jobCards, total] = await Promise.all([
      JobCard.find(query)
        .populate("clientId", "companyName")
        .populate("clientSiteId", "siteName")
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      JobCard.countDocuments(query),
    ]);

    return paginatedResponse(jobCards, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await requireAuth();

    const body = await req.json();
    const {
      clientId,
      clientSiteId,
      clientContactId,
      titleId,
      description,
      technicianBriefing,
      jobDate,
      jobEndDate,
      multiDayJob,
      warranty,
      jobCardType,
      recurringJob,
      recurringPeriod,
      recurringRange,
      startDate,
    } = body;

    if (!clientId) {
      return errorResponse("Client is required");
    }

    // Auto-generate ticketNo by finding max + 1
    const lastJobCard = await JobCard.findOne().sort({ ticketNo: -1 }).lean();
    const ticketNo = lastJobCard && (lastJobCard as any).ticketNo
      ? (lastJobCard as any).ticketNo + 1
      : 1;

    const uniqueId = generateUniqueId();

    const jobCard = await JobCard.create({
      ticketNo,
      uniqueId,
      userId: session.id,
      clientId,
      clientSiteId,
      clientContactId,
      titleId,
      jobDate,
      jobEndDate,
      multiDayJob,
      warranty,
      jobCardType,
      recurringJob,
      recurringPeriod,
      recurringRange,
      startDate,
      jobCardStatus: 1,
      status: 1,
      dateTime: new Date(),
    });

    // Create JobCardDetail
    await JobCardDetail.create({
      jobCardId: jobCard._id,
      description,
      technicianBriefing,
    });

    // Create JobCardLog
    await JobCardLog.create({
      jobCardId: jobCard._id,
      userId: session.id,
      task: "Job card created",
      dateTime: new Date(),
    });

    return successResponse(jobCard, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
