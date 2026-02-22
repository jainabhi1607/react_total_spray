import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import Client from "@/models/Client";
import SupportTicket from "@/models/SupportTicket";
import JobCard from "@/models/JobCard";
import Technician from "@/models/Technician";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await requireAuth();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || q.trim().length === 0) {
      return errorResponse("Search query is required");
    }

    const query = q.trim();
    const isClientUser = [4, 6].includes(session.role);
    const results: any[] = [];

    // Search Clients
    const clientQuery: Record<string, any> = {
      companyName: { $regex: query, $options: "i" },
      status: { $ne: 2 },
    };
    if (isClientUser) {
      clientQuery._id = session.clientId;
    }
    const clients = await Client.find(clientQuery)
      .select("companyName status")
      .limit(5)
      .lean();
    clients.forEach((c: any) => {
      results.push({
        type: "client",
        id: c._id,
        label: c.companyName,
      });
    });

    // Search Support Tickets
    const ticketQuery: Record<string, any> = {
      status: { $ne: 2 },
    };
    if (isClientUser) {
      ticketQuery.clientId = session.clientId;
    }
    const ticketNo = parseInt(query);
    if (!isNaN(ticketNo)) {
      ticketQuery.ticketNo = ticketNo;
    } else {
      // If not a number, skip ticket search since ticketNo is numeric
      ticketQuery.ticketNo = { $exists: false }; // Will return nothing
    }
    const tickets = await SupportTicket.find(ticketQuery)
      .select("ticketNo ticketStatus")
      .limit(5)
      .lean();
    tickets.forEach((t: any) => {
      results.push({
        type: "support_ticket",
        id: t._id,
        label: `Ticket #${t.ticketNo}`,
      });
    });

    // Search Job Cards (ticketNo or uniqueId)
    const jobCardQuery: Record<string, any> = {
      status: { $ne: 2 },
    };
    if (isClientUser) {
      jobCardQuery.clientId = session.clientId;
    }
    const jobCardOrConditions: any[] = [
      { uniqueId: { $regex: query, $options: "i" } },
    ];
    if (!isNaN(ticketNo)) {
      jobCardOrConditions.push({ ticketNo });
    }
    jobCardQuery.$or = jobCardOrConditions;
    const jobCards = await JobCard.find(jobCardQuery)
      .select("ticketNo uniqueId jobCardStatus")
      .limit(5)
      .lean();
    jobCards.forEach((jc: any) => {
      results.push({
        type: "job_card",
        id: jc._id,
        label: `Job Card ${jc.uniqueId}${jc.ticketNo ? ` (#${jc.ticketNo})` : ""}`,
      });
    });

    // Search Technicians (admin only)
    if (!isClientUser) {
      const technicians = await Technician.find({
        companyName: { $regex: query, $options: "i" },
        status: { $ne: 2 },
      })
        .select("companyName")
        .limit(5)
        .lean();
      technicians.forEach((t: any) => {
        results.push({
          type: "technician",
          id: t._id,
          label: t.companyName,
        });
      });
    }

    return successResponse(results);
  } catch (error) {
    return handleApiError(error);
  }
}
