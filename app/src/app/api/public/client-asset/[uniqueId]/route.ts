import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import ClientAsset from "@/models/ClientAsset";
import ClientAssetAttachment from "@/models/ClientAssetAttachment";
import ClientAssetComment from "@/models/ClientAssetComment";
import ClientAssetLogMaintenance from "@/models/ClientAssetLogMaintenance";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    await dbConnect();
    const { uniqueId } = await params;

    const asset = await ClientAsset.findById(uniqueId)
      .populate("clientId", "companyName accessToken")
      .populate("clientSiteId", "siteName")
      .lean();

    if (!asset) {
      return errorResponse("Asset not found", 404);
    }

    const [attachments, comments, maintenanceLogs] = await Promise.all([
      ClientAssetAttachment.find({ clientAssetId: asset._id })
        .sort({ createdAt: -1 })
        .lean(),
      ClientAssetComment.find({ clientAssetId: asset._id })
        .sort({ createdAt: -1 })
        .lean(),
      ClientAssetLogMaintenance.find({ clientAssetId: asset._id })
        .sort({ taskDate: -1 })
        .lean(),
    ]);

    return successResponse({
      asset,
      attachments,
      comments,
      maintenanceLogs,
    });
  } catch (error) {
    console.error("Public client asset GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}
