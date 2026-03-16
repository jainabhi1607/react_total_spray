import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
  enforcePortalScope,
} from "@/lib/api-helpers";
import SupportTicket from "@/models/SupportTicket";
import SupportTicketDetail from "@/models/SupportTicketDetail";
import SupportTicketComment from "@/models/SupportTicketComment";
import SupportTicketAttachment from "@/models/SupportTicketAttachment";
import SupportTicketTechnician from "@/models/SupportTicketTechnician";
import SupportTicketOwner from "@/models/SupportTicketOwner";
import SupportTicketTime from "@/models/SupportTicketTime";
import "@/models/ClientContact";
import "@/models/User";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();

    const { id } = await params;

    const ticket = await SupportTicket.findById(id)
      .populate("clientId")
      .populate("clientSiteId")
      .populate("clientAssetId")
      .populate("clientContactId")
      .populate("titleId")
      .populate("userId", "name email")
      .lean();

    if (!ticket) {
      return errorResponse("Ticket not found", 404);
    }

    enforcePortalScope(session, (ticket as any).clientId?._id || (ticket as any).clientId);

    const isPortal = [4, 6].includes(session.role);
    const commentQuery: Record<string, any> = { supportTicketId: id };
    const attachQuery: Record<string, any> = { supportTicketId: id };
    if (isPortal) {
      commentQuery.visibility = 2;
      attachQuery.visibility = 2;
    }

    const [detail, comments, attachments, technicians, owners, timeLogs] =
      await Promise.all([
        SupportTicketDetail.findOne({ supportTicketId: id })
          .populate("rootCauseUserId", "name lastName")
          .populate("resolutionUserId", "name lastName")
          .lean(),
        SupportTicketComment.find(commentQuery)
          .populate("userId", "name email")
          .sort({ createdAt: -1 })
          .lean(),
        SupportTicketAttachment.find(attachQuery)
          .sort({ createdAt: -1 })
          .lean(),
        SupportTicketTechnician.find({ supportTicketId: id })
          .populate({
            path: "technicianId",
            select: "companyName email phone",
          })
          .lean(),
        SupportTicketOwner.find({ supportTicketId: id })
          .populate("userId", "name lastName email")
          .lean(),
        SupportTicketTime.find({ supportTicketId: id })
          .populate("userId", "name lastName")
          .sort({ createdAt: -1 })
          .lean(),
      ]);

    return successResponse({
      ...ticket,
      detail,
      comments,
      attachments,
      technicians,
      owners,
      timeLogs,
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

    const ticketCheck = await SupportTicket.findById(id).select("clientId").lean();
    if (!ticketCheck) return errorResponse("Not found", 404);
    enforcePortalScope(session, (ticketCheck as any).clientId);

    const body = await req.json();

    const allowedFields = [
      "clientId", "clientSiteId", "clientAssetId", "clientContactId",
      "titleId", "warranty", "parts", "productionImpact",
      "onSiteTechnicianRequired", "ticketStatus", "description",
    ];
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    const ticket = await SupportTicket.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!ticket) {
      return errorResponse("Ticket not found", 404);
    }

    return successResponse(ticket);
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

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { status: 2 },
      { new: true }
    );

    if (!ticket) {
      return errorResponse("Ticket not found", 404);
    }

    return successResponse({ message: "Ticket deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
