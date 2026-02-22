import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import JobCard from "@/models/JobCard";
import JobCardDetail from "@/models/JobCardDetail";
import JobCardComment from "@/models/JobCardComment";
import JobCardAttachment from "@/models/JobCardAttachment";
import JobCardTechnician from "@/models/JobCardTechnician";
import JobCardOwner from "@/models/JobCardOwner";
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

    const jobCard = await JobCard.findById(id)
      .populate("clientId", "companyName")
      .populate("clientSiteId", "siteName")
      .populate("clientContactId", "name email phone")
      .populate("titleId", "title")
      .lean();

    if (!jobCard) {
      return errorResponse("Job card not found", 404);
    }

    // Fetch related data in parallel
    const [detail, comments, attachments, technicians, owners, clientAssets] =
      await Promise.all([
        JobCardDetail.findOne({ jobCardId: id }).lean(),
        JobCardComment.find({ jobCardId: id })
          .populate("userId", "name email")
          .sort({ createdAt: -1 })
          .lean(),
        JobCardAttachment.find({ jobCardId: id })
          .sort({ createdAt: -1 })
          .lean(),
        JobCardTechnician.find({ jobCardId: id })
          .populate("technicianId")
          .lean(),
        JobCardOwner.find({ jobCardId: id })
          .populate("userId", "name email")
          .lean(),
        JobCardClientAsset.find({ jobCardId: id })
          .populate("clientAssetId")
          .lean(),
      ]);

    // Fetch checklist items for each client asset
    const clientAssetsWithChecklist = await Promise.all(
      clientAssets.map(async (asset: any) => {
        const checklistItems = await JobCardAssetChecklistItem.find({
          jobCardClientAssetId: asset._id,
        })
          .sort({ orderNo: 1 })
          .lean();
        return { ...asset, checklistItems };
      })
    );

    return successResponse({
      ...jobCard,
      detail,
      comments,
      attachments,
      technicians,
      owners,
      clientAssets: clientAssetsWithChecklist,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id } = await params;

    const body = await req.json();

    const jobCard = await JobCard.findById(id);
    if (!jobCard) {
      return errorResponse("Job card not found", 404);
    }

    // Update allowed fields
    const allowedFields = [
      "clientId",
      "clientSiteId",
      "clientContactId",
      "titleId",
      "jobDate",
      "jobEndDate",
      "multiDayJob",
      "warranty",
      "jobCardType",
      "jobCardStatus",
      "recurringJob",
      "recurringPeriod",
      "recurringRange",
      "startDate",
      "invoiceNumber",
      "markComplete",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (jobCard as any)[field] = body[field];
      }
    }

    await jobCard.save();

    // Update JobCardDetail if description or technicianBriefing provided
    if (body.description !== undefined || body.technicianBriefing !== undefined) {
      const updateData: Record<string, any> = {};
      if (body.description !== undefined) updateData.description = body.description;
      if (body.technicianBriefing !== undefined) updateData.technicianBriefing = body.technicianBriefing;

      await JobCardDetail.findOneAndUpdate(
        { jobCardId: id },
        updateData,
        { upsert: true, new: true }
      );
    }

    return successResponse(jobCard);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id } = await params;

    const jobCard = await JobCard.findById(id);
    if (!jobCard) {
      return errorResponse("Job card not found", 404);
    }

    // Soft delete
    jobCard.status = 2;
    await jobCard.save();

    return successResponse({ message: "Job card deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
