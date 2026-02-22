import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import SupportTicket from "@/models/SupportTicket";
import SupportTicketDetail from "@/models/SupportTicketDetail";
import SupportTicketComment from "@/models/SupportTicketComment";
import SupportTicketAttachment from "@/models/SupportTicketAttachment";
import SupportTicketTechnician from "@/models/SupportTicketTechnician";
import SupportTicketOwner from "@/models/SupportTicketOwner";
import SupportTicketTime from "@/models/SupportTicketTime";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();

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

    const [detail, comments, attachments, technicians, owners, timeLogs] =
      await Promise.all([
        SupportTicketDetail.findOne({ supportTicketId: id }).lean(),
        SupportTicketComment.find({ supportTicketId: id })
          .populate("userId", "name email")
          .sort({ createdAt: -1 })
          .lean(),
        SupportTicketAttachment.find({ supportTicketId: id })
          .sort({ createdAt: -1 })
          .lean(),
        SupportTicketTechnician.find({ supportTicketId: id })
          .populate({
            path: "technicianId",
            select: "companyName email phone",
          })
          .lean(),
        SupportTicketOwner.find({ supportTicketId: id })
          .populate("userId", "name email")
          .lean(),
        SupportTicketTime.find({ supportTicketId: id })
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
    await requireAuth();

    const { id } = await params;
    const body = await req.json();

    const ticket = await SupportTicket.findByIdAndUpdate(id, body, {
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
