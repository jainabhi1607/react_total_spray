import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ClientAssetLogMaintenance from "@/models/ClientAssetLogMaintenance";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id } = await params;

    // Group maintenance logs by taskName and count
    const breakdown = await ClientAssetLogMaintenance.aggregate([
      { $match: { clientAssetId: { $toObjectId: id } } },
      {
        $group: {
          _id: "$taskName",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const items = breakdown
      .filter((b: { _id: string | null }) => b._id)
      .map((b: { _id: string; count: number }) => ({
        name: b._id,
        count: b.count,
      }));

    const total = items.reduce(
      (sum: number, item: { count: number }) => sum + item.count,
      0
    );

    return successResponse({ items, total });
  } catch (error) {
    return handleApiError(error);
  }
}
