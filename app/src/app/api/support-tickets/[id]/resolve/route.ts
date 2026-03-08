import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import SupportTicket from "@/models/SupportTicket";
import SupportTicketDetail from "@/models/SupportTicketDetail";
import SupportTicketComment from "@/models/SupportTicketComment";
import SupportTicketLog from "@/models/SupportTicketLog";
import ClientContact from "@/models/ClientContact";
import { sendTicketResolvedEmail } from "@/lib/email";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();

    const { id } = await params;
    const body = await req.json();
    const { comment, notifyContactIds } = body;

    if (!comment?.trim()) {
      return errorResponse("Comment is required");
    }

    const ticket = await SupportTicket.findById(id)
      .populate("clientSiteId", "siteName")
      .populate("clientAssetId", "machineName serialNo");

    if (!ticket) {
      return errorResponse("Ticket not found", 404);
    }

    // Update ticket status to Resolved (4)
    ticket.ticketStatus = 4;
    await ticket.save();

    // Save public comment
    await SupportTicketComment.create({
      supportTicketId: id,
      userId: session.id,
      comment: comment.trim(),
      visibility: 1, // public
      dateTime: new Date(),
    });

    // Update ticket detail with resolved info
    await SupportTicketDetail.findOneAndUpdate(
      { supportTicketId: id },
      {
        resolvedComments: comment.trim(),
        resolvedDate: new Date(),
      },
      { new: true, upsert: true }
    );

    // Log the resolution
    await SupportTicketLog.create({
      supportTicketId: id,
      userId: session.id,
      task: "Ticket resolved",
      dateTime: new Date(),
    });

    // Send notification emails to selected contacts
    if (notifyContactIds && notifyContactIds.length > 0) {
      const contacts = await ClientContact.find({
        _id: { $in: notifyContactIds },
      }).lean();

      const siteName = (ticket.clientSiteId as any)?.siteName || "-";
      const asset = ticket.clientAssetId as any;
      const assetName = asset
        ? `${asset.machineName}${asset.serialNo ? ` (${asset.serialNo})` : ""}`
        : "-";

      // Send emails in parallel (don't block response)
      const emailPromises = contacts
        .filter((c: any) => c.email)
        .map((c: any) => {
          const fullName = `${c.name}${c.lastName ? ` ${c.lastName}` : ""}`;
          return sendTicketResolvedEmail(
            c.email,
            fullName,
            ticket.ticketNo,
            siteName,
            assetName,
            comment.trim(),
          ).catch((err) =>
            console.error(`Failed to send resolve email to ${c.email}:`, err)
          );
        });

      // Don't await — fire and forget so the response isn't delayed
      Promise.all(emailPromises).catch(() => {});
    }

    return successResponse(ticket);
  } catch (error) {
    return handleApiError(error);
  }
}
