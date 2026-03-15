import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
  getClientIp,
} from "@/lib/api-helpers";
import JobCardAssetChecklistItem from "@/models/JobCardAssetChecklistItem";
import JobCardClientAsset from "@/models/JobCardClientAsset";
import ChecklistTemplate from "@/models/ChecklistTemplate";
import ChecklistTemplateItem from "@/models/ChecklistTemplateItem";
import JobCardLog from "@/models/JobCardLog";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id, assetId } = await params;

    const body = await req.json();
    const { templateId } = body;

    if (!templateId) {
      return errorResponse("Template ID is required");
    }

    // Verify the job card client asset exists
    const clientAsset = await JobCardClientAsset.findById(assetId);
    if (!clientAsset) {
      return errorResponse("Job card asset not found", 404);
    }

    // Verify the template exists
    const template = await ChecklistTemplate.findById(templateId);
    if (!template) {
      return errorResponse("Checklist template not found", 404);
    }

    // Get template items
    const templateItems = await ChecklistTemplateItem.find({
      checklistTemplateId: templateId,
    })
      .sort({ orderNo: 1 })
      .lean();

    if (templateItems.length === 0) {
      return successResponse([], 201);
    }

    // Get current max orderNo for this asset's checklist
    const existingItems = await JobCardAssetChecklistItem.find({
      jobCardClientAssetId: assetId,
    }).lean();
    const maxOrder = Math.max(0, ...existingItems.map((i: any) => i.orderNo || 0));

    // Copy template items to job card asset checklist
    const newItems = templateItems.map((item: any, index: number) => ({
      jobCardClientAssetId: assetId,
      userId: session.id,
      details: item.details,
      checklistItemType: item.checklistItemType,
      makeResponseMandatory: item.makeResponseMandatory,
      orderNo: maxOrder + index + 1,
      fileName: item.fileName,
      fileSize: item.fileSize,
      fileRealName: item.fileRealName,
      setDateTime: new Date(),
    }));

    const created = await JobCardAssetChecklistItem.insertMany(newItems);

    // Log template addition
    await JobCardLog.create({
      jobCardId: id,
      userId: session.id,
      task: `Checklist template "${template.title}" added (${created.length} items)`,
      dateTime: new Date(),
      ipAddress: getClientIp(req),
    });

    return successResponse(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
