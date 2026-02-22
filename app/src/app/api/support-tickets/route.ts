import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
  getSearchParams,
  paginatedResponse,
} from "@/lib/api-helpers";
import SupportTicket from "@/models/SupportTicket";
import SupportTicketDetail from "@/models/SupportTicketDetail";
import SupportTicketLog from "@/models/SupportTicketLog";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { page, limit, skip, search, status } = getSearchParams(req);

    const query: Record<string, any> = {};

    // Client users can only see their own tickets
    if ([4, 6].includes(session.role)) {
      if (!session.clientId) {
        return errorResponse("No client associated with this account", 403);
      }
      query.clientId = session.clientId;
    }

    // Search by ticketNo or description
    if (search) {
      const searchNum = parseInt(search);
      if (!isNaN(searchNum)) {
        query.ticketNo = searchNum;
      } else {
        query.$or = [
          { invoiceNumber: { $regex: search, $options: "i" } },
        ];
      }
    }

    // Filter by status (active/inactive)
    if (status !== undefined) {
      query.status = status;
    } else {
      query.status = { $ne: 2 };
    }

    // Filter by ticketStatus
    const { searchParams } = new URL(req.url);
    const ticketStatus = searchParams.get("ticketStatus");
    if (ticketStatus) {
      query.ticketStatus = parseInt(ticketStatus);
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate("clientId", "companyName")
        .populate("clientSiteId", "siteName")
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportTicket.countDocuments(query),
    ]);

    return paginatedResponse(tickets, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await requireAuth();

    const body = await req.json();
    const {
      clientId,
      clientSiteId,
      clientAssetId,
      clientContactId,
      titleId,
      description,
      warranty,
      parts,
      productionImpact,
      onSiteTechnicianRequired,
    } = body;

    if (!clientId) {
      return errorResponse("Client is required");
    }

    // Auto-generate ticketNo
    const lastTicket = await SupportTicket.findOne()
      .sort({ ticketNo: -1 })
      .select("ticketNo")
      .lean();
    const ticketNo = lastTicket ? (lastTicket as any).ticketNo + 1 : 1;

    const ticket = await SupportTicket.create({
      ticketNo,
      userId: session.id,
      clientId,
      clientSiteId,
      clientAssetId,
      clientContactId,
      titleId,
      warranty,
      parts,
      productionImpact,
      onSiteTechnicianRequired,
      ticketStatus: 1,
      status: 1,
      dateTime: new Date(),
    });

    // Create associated detail record
    await SupportTicketDetail.create({
      supportTicketId: ticket._id,
      description,
    });

    // Create log entry
    await SupportTicketLog.create({
      supportTicketId: ticket._id,
      userId: session.id,
      task: "Ticket created",
      dateTime: new Date(),
    });

    return successResponse(ticket, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
