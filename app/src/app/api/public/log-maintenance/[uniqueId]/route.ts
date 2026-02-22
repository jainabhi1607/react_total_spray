import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import ClientAsset from "@/models/ClientAsset";
import MaintenanceTask from "@/models/MaintenanceTask";
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

    const maintenanceTasks = await MaintenanceTask.find({
      clientId: (asset as any).clientId._id || (asset as any).clientId,
    })
      .select("title")
      .sort({ title: 1 })
      .lean();

    return successResponse({
      asset,
      maintenanceTasks,
    });
  } catch (error) {
    console.error("Public log-maintenance GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    await dbConnect();
    const { uniqueId } = await params;

    const asset = await ClientAsset.findById(uniqueId);
    if (!asset) {
      return errorResponse("Asset not found", 404);
    }

    const body = await req.json();
    const { task, taskName, notes, taskDate } = body;

    if (!taskName && !task) {
      return errorResponse("Task or task name is required");
    }

    const maintenanceLog = await ClientAssetLogMaintenance.create({
      clientAssetId: asset._id,
      task: task || undefined,
      taskName: taskName || undefined,
      notes: notes || undefined,
      taskDate: taskDate ? new Date(taskDate) : new Date(),
      dateTime: new Date(),
    });

    return successResponse(maintenanceLog, 201);
  } catch (error) {
    console.error("Public log-maintenance POST error:", error);
    return errorResponse("Internal server error", 500);
  }
}
