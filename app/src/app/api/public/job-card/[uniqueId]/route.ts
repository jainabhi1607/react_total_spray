import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import JobCard from "@/models/JobCard";
import JobCardDetail from "@/models/JobCardDetail";
import JobCardClientAsset from "@/models/JobCardClientAsset";
import JobCardAssetChecklistItem from "@/models/JobCardAssetChecklistItem";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    await dbConnect();
    const { uniqueId } = await params;

    const jobCard = await JobCard.findOne({ uniqueId })
      .populate("clientId", "companyName companyLogo")
      .populate("clientSiteId", "siteName")
      .populate("clientContactId", "name email phone")
      .lean();

    if (!jobCard) {
      return errorResponse("Job card not found", 404);
    }

    const jobCardDetail = await JobCardDetail.findOne({
      jobCardId: jobCard._id,
    }).lean();

    const jobCardAssets = await JobCardClientAsset.find({
      jobCardId: jobCard._id,
    })
      .populate("clientAssetId", "machineName serialNo")
      .lean();

    const assetsWithChecklists = await Promise.all(
      jobCardAssets.map(async (asset: any) => {
        const checklistItems = await JobCardAssetChecklistItem.find({
          jobCardClientAssetId: asset._id,
        })
          .sort({ orderNo: 1 })
          .lean();

        return {
          ...asset,
          checklistItems,
        };
      })
    );

    return successResponse({
      jobCard,
      jobCardDetail,
      assets: assetsWithChecklists,
    });
  } catch (error) {
    console.error("Public job card GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    await dbConnect();
    const { uniqueId } = await params;

    const jobCard = await JobCard.findOne({ uniqueId });
    if (!jobCard) {
      return errorResponse("Job card not found", 404);
    }

    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return errorResponse("Items array is required");
    }

    const updatePromises = items.map((item: any) => {
      const updateData: Record<string, any> = {};

      if (item.responseType1 !== undefined) updateData.responseType1 = item.responseType1;
      if (item.responseType2 !== undefined) updateData.responseType2 = item.responseType2;
      if (item.comments !== undefined) updateData.comments = item.comments;
      if (item.markAsDone !== undefined) updateData.markAsDone = item.markAsDone;
      if (item.signature !== undefined) updateData.signature = item.signature;
      if (item.signatureDateTime !== undefined) updateData.signatureDateTime = item.signatureDateTime;
      if (item.responseType7 !== undefined) updateData.responseType7 = item.responseType7;
      if (item.responseType10 !== undefined) updateData.responseType10 = item.responseType10;
      if (item.setDateTime !== undefined) updateData.setDateTime = item.setDateTime;

      return JobCardAssetChecklistItem.findByIdAndUpdate(
        item.itemId,
        { $set: updateData },
        { new: true }
      );
    });

    await Promise.all(updatePromises);

    return successResponse({ message: "Checklist responses updated successfully" });
  } catch (error) {
    console.error("Public job card PUT error:", error);
    return errorResponse("Internal server error", 500);
  }
}
