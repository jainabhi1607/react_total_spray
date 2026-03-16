import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  handleApiError,
} from "@/lib/api-helpers";
import JobCardClientAsset from "@/models/JobCardClientAsset";
import JobCard from "@/models/JobCard";
import JobCardType from "@/models/JobCardType";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id } = await params;

    // Find all job card assignments for this asset
    const jcAssets = await JobCardClientAsset.find({ clientAssetId: id })
      .select("jobCardId")
      .lean();

    if (jcAssets.length === 0) {
      return successResponse({ items: [], total: 0 });
    }

    const jobCardIds = jcAssets.map((a: any) => a.jobCardId);

    // Get job cards with their types
    const jobCards = await JobCard.find({
      _id: { $in: jobCardIds },
      status: { $ne: 2 },
      jobCardType: { $exists: true, $ne: null },
    })
      .select("jobCardType")
      .lean();

    // Count by jobCardType
    const typeCounts = new Map<string, number>();
    for (const jc of jobCards as any[]) {
      const typeId = jc.jobCardType.toString();
      typeCounts.set(typeId, (typeCounts.get(typeId) || 0) + 1);
    }

    // Fetch type names
    const typeIds = [...typeCounts.keys()];
    const types = await JobCardType.find({ _id: { $in: typeIds } })
      .select("title")
      .lean();

    const typeNameMap = new Map<string, string>();
    for (const t of types as any[]) {
      typeNameMap.set(t._id.toString(), t.title);
    }

    const items = typeIds.map((typeId) => ({
      name: typeNameMap.get(typeId) || "Unknown",
      count: typeCounts.get(typeId) || 0,
    }));

    items.sort((a, b) => b.count - a.count);

    const total = items.reduce((sum, i) => sum + i.count, 0);

    return successResponse({ items, total });
  } catch (error) {
    return handleApiError(error);
  }
}
