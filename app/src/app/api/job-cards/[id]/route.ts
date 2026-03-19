import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
  getClientIp,
  enforcePortalScope,
} from "@/lib/api-helpers";
import JobCard from "@/models/JobCard";
import JobCardDetail from "@/models/JobCardDetail";
import JobCardComment from "@/models/JobCardComment";
import JobCardAttachment from "@/models/JobCardAttachment";
import JobCardTechnician from "@/models/JobCardTechnician";
import JobCardOwner from "@/models/JobCardOwner";
import JobCardClientAsset from "@/models/JobCardClientAsset";
import JobCardAssetChecklistItem from "@/models/JobCardAssetChecklistItem";
import JobCardAssetChecklistItemAttachment from "@/models/JobCardAssetChecklistItemAttachment";
import Client from "@/models/Client";
import ClientSite from "@/models/ClientSite";
import ClientContact from "@/models/ClientContact";
import ClientAsset from "@/models/ClientAsset";
import "@/models/AssetMake";
import "@/models/AssetModel";
import Title from "@/models/Title";
import "@/models/User";
import "@/models/SupportTicket";
import JobCardType from "@/models/JobCardType";
import JobCardLog from "@/models/JobCardLog";
import { JOB_CARD_STATUS_LABELS } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id } = await params;

    const jobCard = await JobCard.findById(id)
      .populate("clientId", "companyName address")
      .populate("clientSiteId", "siteName address")
      .populate("clientAssetId", "machineName")
      .populate("clientContactId", "name lastName email phone position")
      .populate("titleId", "title")
      .populate("jobCardType", "title")
      .populate("supportTicketId", "ticketNo")
      .lean();

    if (!jobCard) {
      return errorResponse("Job card not found", 404);
    }
    enforcePortalScope(session, (jobCard as any).clientId?._id || (jobCard as any).clientId);

    const isPortal = [4, 6].includes(session.role);

    // Portal users cannot access recurring templates
    if (isPortal && (jobCard as any).recurringJob === 1) {
      return errorResponse("Job card not found", 404);
    }
    const jcCommentQuery: Record<string, any> = { jobCardId: id };
    const jcAttachQuery: Record<string, any> = { jobCardId: id };
    if (isPortal) {
      jcCommentQuery.visibility = 2;
      jcAttachQuery.visibility = 2;
    }

    // Fetch related data in parallel
    const [detail, comments, attachments, technicians, owners, clientAssets] =
      await Promise.all([
        JobCardDetail.findOne({ jobCardId: id }).lean(),
        JobCardComment.find(jcCommentQuery)
          .populate("userId", "name email")
          .sort({ createdAt: -1 })
          .lean(),
        JobCardAttachment.find(jcAttachQuery)
          .sort({ createdAt: -1 })
          .lean(),
        JobCardTechnician.find({ jobCardId: id })
          .populate("technicianId")
          .lean(),
        JobCardOwner.find({ jobCardId: id })
          .populate("userId", "name email")
          .lean(),
        JobCardClientAsset.find({ jobCardId: id })
          .populate({
            path: "clientAssetId",
            populate: [
              { path: "assetMakeId", select: "title" },
              { path: "assetModelId", select: "title" },
            ],
          })
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

        // Fetch attachments for image-type checklist items
        const itemIds = checklistItems.map((item: any) => item._id);
        const attachments = await JobCardAssetChecklistItemAttachment.find({
          jobCardAssetChecklistItemId: { $in: itemIds },
        }).lean();
        const attachmentMap = new Map<string, any[]>();
        for (const att of attachments as any[]) {
          const key = att.jobCardAssetChecklistItemId.toString();
          if (!attachmentMap.has(key)) attachmentMap.set(key, []);
          attachmentMap.get(key)!.push(att);
        }
        const itemsWithAttachments = checklistItems.map((item: any) => ({
          ...item,
          attachments: attachmentMap.get(item._id.toString()) || [],
        }));

        // Auto-calculate completed count based on actual responses
        const SECTION_BREAK = 0;
        const TEXT_ONLY = 9;
        const respondableItems = itemsWithAttachments.filter(
          (item: any) => item.checklistItemType !== SECTION_BREAK && item.checklistItemType !== TEXT_ONLY
        );
        const completedCount = respondableItems.filter((item: any) => {
          switch (item.checklistItemType) {
            case 1: // Checkbox
            case 5: // Yes/No
              return item.responseType1 && item.responseType1 > 0;
            case 2: // Pass/Fail/N/A
            case 6: // Poor/Fair/Good
              return item.responseType2 && item.responseType2 > 0;
            case 3: // Image
              return item.attachments && item.attachments.length > 0;
            case 4: // Comment
              return item.comments && item.comments.trim().length > 0;
            case 7: // Signature
              return item.signature && item.signature.length > 0;
            case 8: // Set Date & Time
              return !!item.setDateTime;
            default:
              return false;
          }
        }).length;

        return { ...asset, checklistItems: itemsWithAttachments, completeChecklist: completedCount };
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
    const session = await requireAuth();
    const { id } = await params;

    const body = await req.json();

    const jobCard = await JobCard.findById(id);
    if (!jobCard) {
      return errorResponse("Job card not found", 404);
    }
    enforcePortalScope(session, jobCard.clientId);

    // Track changes for logging
    const changes: string[] = [];
    const allowedFields = [
      "clientId",
      "clientSiteId",
      "clientAssetId",
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
      "status",
      "contractApprove",
      "nextRecurringDate",
    ];

    // Label maps for human-readable logs
    const WARRANTY_LABELS: Record<number, string> = { 0: "None", 1: "Warranty", 2: "Out of Warranty", 3: "FOC" };
    const RECURRING_LABELS: Record<number, string> = { 0: "No", 1: "Yes" };
    const MULTI_DAY_LABELS: Record<number, string> = { 0: "No", 1: "Yes" };

    // Resolve reference field names (clientId, siteId, etc.)
    async function resolveFieldValue(field: string, value: any): Promise<string> {
      try {
        switch (field) {
          case "clientId": {
            const doc = await Client.findById(value).select("companyName").lean();
            return (doc as any)?.companyName || String(value);
          }
          case "clientSiteId": {
            const doc = await ClientSite.findById(value).select("siteName").lean();
            return (doc as any)?.siteName || String(value);
          }
          case "clientAssetId": {
            const doc = await ClientAsset.findById(value).select("machineName").lean();
            return (doc as any)?.machineName || String(value);
          }
          case "clientContactId": {
            const doc = await ClientContact.findById(value).select("name lastName").lean();
            return doc ? `${(doc as any).name}${(doc as any).lastName ? " " + (doc as any).lastName : ""}` : String(value);
          }
          case "titleId": {
            const doc = await Title.findById(value).select("title").lean();
            return (doc as any)?.title || String(value);
          }
          case "jobCardType": {
            const doc = await JobCardType.findById(value).select("title").lean();
            return (doc as any)?.title || String(value);
          }
          case "warranty":
            return WARRANTY_LABELS[Number(value)] || String(value);
          case "jobCardStatus":
            return JOB_CARD_STATUS_LABELS[Number(value)] || String(value);
          case "multiDayJob":
            return MULTI_DAY_LABELS[Number(value)] || String(value);
          case "recurringJob":
            return RECURRING_LABELS[Number(value)] || String(value);
          case "jobDate":
          case "jobEndDate":
          case "startDate":
            return value ? new Date(value).toLocaleString() : "None";
          default:
            return String(value);
        }
      } catch {
        return String(value);
      }
    }

    const FIELD_LABELS: Record<string, string> = {
      clientId: "Client",
      clientSiteId: "Site",
      clientAssetId: "Asset",
      clientContactId: "Contact",
      titleId: "Title",
      jobDate: "Job Card Date",
      jobEndDate: "Job End Date",
      multiDayJob: "Multi Day Job",
      warranty: "Warranty",
      jobCardType: "Job Card Type",
      jobCardStatus: "Job Card Status",
      recurringJob: "Recurring Job",
      recurringPeriod: "Recurring Period",
      recurringRange: "Recurring Range",
      startDate: "Start Date",
      invoiceNumber: "Invoice Number",
      markComplete: "Mark Complete",
    };

    for (const field of allowedFields) {
      if (body[field] !== undefined && String((jobCard as any)[field]) !== String(body[field])) {
        const label = FIELD_LABELS[field] || field;
        const readableValue = await resolveFieldValue(field, body[field]);
        changes.push(`${label} changed: ${readableValue}`);
        (jobCard as any)[field] = body[field];
      }
    }

    await jobCard.save();

    // Update JobCardDetail if description or technicianBriefing provided
    if (body.description !== undefined || body.technicianBriefing !== undefined) {
      const updateData: Record<string, any> = {};
      if (body.description !== undefined) {
        updateData.description = body.description;
        changes.push("Description updated");
      }
      if (body.technicianBriefing !== undefined) {
        updateData.technicianBriefing = body.technicianBriefing;
        changes.push("Technician Briefing updated");
      }

      await JobCardDetail.findOneAndUpdate(
        { jobCardId: id },
        updateData,
        { upsert: true, new: true }
      );
    }

    // Log changes
    if (changes.length > 0) {
      await JobCardLog.create({
        jobCardId: id,
        userId: session.id,
        task: changes.join(", "),
        dateTime: new Date(),
        ipAddress: getClientIp(req),
      });
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
