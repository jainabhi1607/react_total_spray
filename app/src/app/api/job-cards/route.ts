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
import JobCardClientAsset from "@/models/JobCardClientAsset";
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
    let searchOrCondition: Record<string, any>[] | null = null;
    if (search) {
      const searchNum = parseInt(search);
      if (!isNaN(searchNum)) {
        searchOrCondition = [{ ticketNo: searchNum }];
      } else {
        searchOrCondition = [{ uniqueId: { $regex: search, $options: "i" } }];
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

    // Tab filtering: active, complete, recurring, upcoming (portal), completed (portal)
    const tab = searchParams.get("tab");
    const isPortalUser = [4, 6].includes(session.role);

    if (tab === "upcoming") {
      // Portal: upcoming services — exclude recurring templates, status < 8 or null
      query.freshRecurringJob = null;
      query.recurringJob = { $ne: 1 };
      const statusOr = [{ jobCardStatus: { $lt: 8 } }, { jobCardStatus: null }];
      if (searchOrCondition) {
        query.$and = [{ $or: searchOrCondition }, { $or: statusOr }];
      } else {
        query.$or = statusOr;
      }
    } else if (tab === "completed") {
      // Portal: completed services — exclude recurring templates, status >= 8
      query.freshRecurringJob = null;
      query.recurringJob = { $ne: 1 };
      query.jobCardStatus = { $gte: 8 };
      if (searchOrCondition) query.$or = searchOrCondition;
    } else if (tab === "active") {
      query.jobCardStatus = { $gte: 0, $lte: 8 };
      query.recurringJob = { $ne: 1 };
      if (searchOrCondition) query.$or = searchOrCondition;
    } else if (tab === "complete") {
      query.jobCardStatus = 9;
      if (searchOrCondition) query.$or = searchOrCondition;
    } else if (tab === "recurring") {
      query.recurringJob = 1;
      if (searchOrCondition) query.$or = searchOrCondition;
    } else {
      if (searchOrCondition) query.$or = searchOrCondition;
    }

    // Portal-specific: exclude Breakdown Service / General Breakdown types
    if (isPortalUser && (tab === "upcoming" || tab === "completed")) {
      // Find excluded type IDs
      const JobCardTypeModel = (await import("@/models/JobCardType")).default;
      const excludedTypes = await JobCardTypeModel.find({
        title: { $in: ["Breakdown Service", "General Breakdown"] },
      }).select("_id").lean();
      const excludedIds = excludedTypes.map((t: any) => t._id);

      // Exclude specific breakdown types (but allow null/unset types)
      if (excludedIds.length > 0) {
        query.jobCardType = { $nin: excludedIds };
      }
    }

    const [jobCards, total] = await Promise.all([
      JobCard.find(query)
        .populate("clientId", "companyName")
        .populate("clientSiteId", "siteName")
        .populate("clientAssetId", "machineName")
        .populate("titleId", "title")
        .populate("jobCardType", "title")
        .populate("userId", "name email")
        .sort(tab === "upcoming" ? { jobDate: 1 } : { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      JobCard.countDocuments(query),
    ]);

    // For portal tabs, add totalAssets count per job card
    if (isPortalUser && (tab === "upcoming" || tab === "completed")) {
      const jobCardIds = jobCards.map((j: any) => j._id);
      const assetCounts = await JobCardClientAsset.aggregate([
        { $match: { jobCardId: { $in: jobCardIds } } },
        { $group: { _id: "$jobCardId", count: { $sum: 1 } } },
      ]);
      const countMap = new Map(assetCounts.map((a: any) => [String(a._id), a.count]));
      for (const jc of jobCards as any[]) {
        jc.totalAssets = countMap.get(String(jc._id)) || 0;
      }
    }

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

    // Portal users: enforce clientId from session
    const effectiveClientId = [4, 6].includes(session.role) && session.clientId
      ? session.clientId
      : clientId;

    if (!effectiveClientId) {
      return errorResponse("Client is required");
    }

    // Auto-generate ticketNo only for actual job cards, not recurring templates
    const isRecurringTemplate = recurringJob === 1;
    let ticketNo: number | undefined;
    if (!isRecurringTemplate) {
      const lastJobCard = await JobCard.findOne({ ticketNo: { $exists: true } }).sort({ ticketNo: -1 }).lean();
      ticketNo = lastJobCard && (lastJobCard as any).ticketNo
        ? (lastJobCard as any).ticketNo + 1
        : 10000;
    }

    const uniqueId = generateUniqueId();

    const createData: Record<string, any> = {
      ...(ticketNo !== undefined ? { ticketNo } : {}),
      uniqueId,
      userId: session.id,
      clientId: effectiveClientId,
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
      task: isRecurringTemplate
        ? "Recurring Job Created"
        : `Job Card Created: ${ticketNo}${supportTicketId ? " (from Support Ticket)" : ""}`,
      dateTime: new Date(),
    });

    return successResponse(jobCard, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
