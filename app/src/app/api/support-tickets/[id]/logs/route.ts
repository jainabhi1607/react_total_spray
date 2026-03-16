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
import SupportTicket from "@/models/SupportTicket";
import SupportTicketLog from "@/models/SupportTicketLog";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();

    const { id } = await params;

    const ticket = await SupportTicket.findById(id).select("clientId").lean();
    if (!ticket) return errorResponse("Not found", 404);
    enforcePortalScope(session, (ticket as any).clientId);

    const { page, limit, skip } = getSearchParams(req);

    const [logs, total] = await Promise.all([
      SupportTicketLog.find({ supportTicketId: id })
        .populate("userId", "name lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportTicketLog.countDocuments({ supportTicketId: id }),
    ]);

    return paginatedResponse(logs, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}
