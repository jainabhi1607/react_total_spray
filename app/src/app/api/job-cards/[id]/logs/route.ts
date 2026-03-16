import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  getSearchParams,
  paginatedResponse,
  handleApiError,
  enforcePortalScope,
} from "@/lib/api-helpers";
import JobCard from "@/models/JobCard";
import JobCardLog from "@/models/JobCardLog";
import "@/models/User";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();

    const { id } = await params;
    const jobCard = await JobCard.findById(id).select("clientId").lean();
    if (!jobCard) return errorResponse("Not found", 404);
    enforcePortalScope(session, (jobCard as any).clientId);
    const { page, limit, skip } = getSearchParams(req);

    const [logs, total] = await Promise.all([
      JobCardLog.find({ jobCardId: id })
        .populate("userId", "name lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      JobCardLog.countDocuments({ jobCardId: id }),
    ]);

    return paginatedResponse(logs, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}
