import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import JobCardClientAsset from "@/models/JobCardClientAsset";
import JobCardAssetChecklistItem from "@/models/JobCardAssetChecklistItem";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id } = await params;

    const clientAssets = await JobCardClientAsset.find({ jobCardId: id })
      .populate("clientAssetId")
      .lean();

    // Fetch checklist items for each client asset
    const assetsWithChecklist = await Promise.all(
      clientAssets.map(async (asset: any) => {
        const checklistItems = await JobCardAssetChecklistItem.find({
          jobCardClientAssetId: asset._id,
        })
          .sort({ orderNo: 1 })
          .lean();
        return { ...asset, checklistItems };
      })
    );

    return successResponse(assetsWithChecklist);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id } = await params;

    const body = await req.json();
    const { clientAssetId } = body;

    if (!clientAssetId) {
      return errorResponse("Client asset ID is required");
    }

    // Check if asset is already added
    const existing = await JobCardClientAsset.findOne({
      jobCardId: id,
      clientAssetId,
      status: { $ne: 2 },
    });

    if (existing) {
      return errorResponse("Asset is already added to this job card");
    }

    const jobCardClientAsset = await JobCardClientAsset.create({
      jobCardId: id,
      clientAssetId,
      addedBy: session.id,
      dateTime: new Date(),
      status: 1,
    });

    return successResponse(jobCardClientAsset, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
