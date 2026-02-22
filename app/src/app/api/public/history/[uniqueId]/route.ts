import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import ClientAsset from "@/models/ClientAsset";
import ClientAssetLogMaintenance from "@/models/ClientAssetLogMaintenance";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    await dbConnect();
    const { uniqueId } = await params;

    const asset = await ClientAsset.findById(uniqueId)
      .populate("clientId", "companyName")
      .populate("clientSiteId", "siteName")
      .lean();

    if (!asset) {
      return errorResponse("Asset not found", 404);
    }

    const maintenanceLogs = await ClientAssetLogMaintenance.find({
      clientAssetId: asset._id,
    })
      .sort({ taskDate: -1 })
      .lean();

    return successResponse({
      asset,
      maintenanceLogs,
    });
  } catch (error) {
    console.error("Public history GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}
