import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  handleApiError,
} from "@/lib/api-helpers";
import Client from "@/models/Client";
import SupportTicket from "@/models/SupportTicket";
import JobCard from "@/models/JobCard";
import Technician from "@/models/Technician";
import ClientSite from "@/models/ClientSite";
import ClientAsset from "@/models/ClientAsset";

export async function GET() {
  try {
    await dbConnect();
    const session = await requireAuth();

    const isAdmin = [1, 2, 3].includes(session.role);

    if (isAdmin) {
      const [
        activeClients,
        openTickets,
        openJobCards,
        activeTechnicians,
        recentTickets,
        recentJobCards,
        ticketsByStatus,
        jobCardsByStatus,
      ] = await Promise.all([
        Client.countDocuments({ status: 1 }),
        SupportTicket.countDocuments({ status: 1, ticketStatus: { $nin: [3, 4] } }),
        JobCard.countDocuments({ status: 1, jobCardStatus: { $nin: [3, 4] } }),
        Technician.countDocuments({ status: 1 }),
        SupportTicket.find({ status: 1 })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("clientId", "companyName")
          .lean(),
        JobCard.find({ status: 1 })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("clientId", "companyName")
          .lean(),
        SupportTicket.aggregate([
          { $match: { status: 1 } },
          { $group: { _id: "$ticketStatus", count: { $sum: 1 } } },
        ]),
        JobCard.aggregate([
          { $match: { status: 1 } },
          { $group: { _id: "$jobCardStatus", count: { $sum: 1 } } },
        ]),
      ]);

      return successResponse({
        activeClients,
        openTickets,
        openJobCards,
        activeTechnicians,
        recentTickets,
        recentJobCards,
        ticketsByStatus,
        jobCardsByStatus,
      });
    } else {
      // Client user (role 4, 6)
      const clientId = session.clientId;

      const [sites, assets, openTickets, openJobCards] = await Promise.all([
        ClientSite.countDocuments({ clientId, status: 1 }),
        ClientAsset.countDocuments({ clientId, status: 1 }),
        SupportTicket.countDocuments({
          clientId,
          status: 1,
          ticketStatus: { $nin: [3, 4] },
        }),
        JobCard.countDocuments({
          clientId,
          status: 1,
          jobCardStatus: { $nin: [3, 4] },
        }),
      ]);

      return successResponse({
        sites,
        assets,
        openTickets,
        openJobCards,
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
