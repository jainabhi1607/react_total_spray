import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  handleApiError,
} from "@/lib/api-helpers";
import JobCard from "@/models/JobCard";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await requireAuth();

    const query: Record<string, any> = { status: { $ne: 2 } };

    // Client users can only see their own job cards
    if ([4, 6].includes(session.role)) {
      if (!session.clientId) {
        return successResponse({ open: 0, inProgress: 0, completed: 0, total: 0 });
      }
      query.clientId = session.clientId;
    }

    const counts = await JobCard.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$jobCardStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusMap: Record<number, number> = {};
    for (const c of counts) {
      statusMap[c._id] = c.count;
    }

    const open = statusMap[1] || 0;
    const inProgress = [2, 3, 4, 5, 6, 7, 8].reduce((sum, s) => sum + (statusMap[s] || 0), 0);
    const completed = statusMap[9] || 0;
    const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

    return successResponse({ open, inProgress, completed, total });
  } catch (error) {
    return handleApiError(error);
  }
}
