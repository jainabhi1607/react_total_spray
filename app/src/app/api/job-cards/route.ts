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
import "@/models/ClientAsset";
import "@/models/Title";
import "@/models/JobCardType";
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

    const { searchParams } = new URL(req.url);

    // Filter by clientId
    const clientIdParam = searchParams.get("clientId");
    if (clientIdParam && !query.clientId) {
      query.clientId = clientIdParam;
    }

    // Filter by clientSiteId
    const clientSiteIdParam = searchParams.get("clientSiteId");
    if (clientSiteIdParam) {
      query.clientSiteId = clientSiteIdParam;
    }

    // Filter by clientAssetId
    const clientAssetIdParam = searchParams.get("clientAssetId");
    if (clientAssetIdParam) {
      query.clientAssetId = clientAssetIdParam;
    }

    // Filter by supportTicketId
    const supportTicketIdParam = searchParams.get("supportTicketId");
    if (supportTicketIdParam) {
      query.supportTicketId = supportTicketIdParam;
    }

    // Filter by jobCardStatus
    const jobCardStatus = searchParams.get("jobCardStatus");
    if (jobCardStatus) {
      query.jobCardStatus = parseInt(jobCardStatus);
    }

    // Tab filtering: active, complete, recurring
    const tab = searchParams.get("tab");
    if (tab === "active") {
      query.jobCardStatus = { $gte: 0, $lte: 8 };
      query.recurringJob = { $ne: 1 };
    } else if (tab === "complete") {
      query.jobCardStatus = 9;
    } else if (tab === "recurring") {
      query.recurringJob = 1;
    }

    const [jobCards, total] = await Promise.all([
      JobCard.find(query)
        .populate("clientId", "companyName")
        .populate("clientSiteId", "siteName")
        .populate("clientAssetId", "machineName")
        .populate("titleId", "title")
        .populate("jobCardType", "title")
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
      clientAssetId,
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
      supportTicketId,
    } = body;

    if (!clientId) {
      return errorResponse("Client is required");
    }

    // Auto-generate ticketNo by finding max + 1
    const lastJobCard = await JobCard.findOne().sort({ ticketNo: -1 }).lean();
    const ticketNo = lastJobCard && (lastJobCard as any).ticketNo
      ? (lastJobCard as any).ticketNo + 1
      : 10000;

    const uniqueId = generateUniqueId();

    const createData: Record<string, any> = {
      ticketNo,
      uniqueId,
      userId: session.id,
      clientId,
      clientSiteId,
      clientAssetId,
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
      jobCardStatus: supportTicketId ? 0 : recurringJob === 1 ? 0 : 1,
      status: 1,
      dateTime: new Date(),
    };

    if (supportTicketId) {
      createData.supportTicketId = supportTicketId;
    }

    const jobCard = await JobCard.create(createData);

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
      task: `Job Card Created: ${ticketNo}${supportTicketId ? " (from Support Ticket)" : ""}`,
      dateTime: new Date(),
    });

    return successResponse(jobCard, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
