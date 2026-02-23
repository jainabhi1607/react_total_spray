import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  handleApiError,
} from "@/lib/api-helpers";
import SupportTicket from "@/models/SupportTicket";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await requireAuth();

    const query: Record<string, any> = { status: { $ne: 2 } };

    // Client users can only see their own tickets
    if ([4, 6].includes(session.role)) {
      if (!session.clientId) {
        return successResponse({ open: 0, working: 0, onSiteTechnician: 0, resolved: 0, total: 0 });
      }
      query.clientId = session.clientId;
    }

    const counts = await SupportTicket.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$ticketStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusMap: Record<number, number> = {};
    for (const c of counts) {
      statusMap[c._id] = c.count;
    }

    const open = statusMap[1] || 0;
    const working = statusMap[2] || 0;
    const onSiteTechnician = statusMap[3] || 0;
    const resolved = statusMap[4] || 0;
    const total = open + working + onSiteTechnician + resolved;

    return successResponse({ open, working, onSiteTechnician, resolved, total });
  } catch (error) {
    return handleApiError(error);
  }
}
