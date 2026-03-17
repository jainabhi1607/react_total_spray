import mongoose from "mongoose";
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
import ClientContact from "@/models/ClientContact";
import ClientAssetLogMaintenance from "@/models/ClientAssetLogMaintenance";
import User from "@/models/User";
import JobCardType from "@/models/JobCardType";

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
      const clientObjId = new mongoose.Types.ObjectId(clientId);

      // Get all client asset IDs for maintenance lookups
      const clientAssets = await ClientAsset.find({ clientId, status: 1 }).select("_id machineName").lean();
      const clientAssetIds = clientAssets.map((a: any) => a._id);

      const [
        sites,
        assets,
        openTickets,
        openJobCards,
        recentTickets,
        recentJobCards,
        ticketsByStatus,
        jobCardsByStatus,
        contacts,
        activeUsers,
        _unusedMaintenanceCount, // replaced by chart aggregation
        // Asset with most support tickets
        assetWithMostTickets,
        // Next upcoming job card (service)
        nextService,
        // Upcoming services by site (top 4)
        upcomingServiceSites,
        // Asset with most maintenance actions
        assetWithMostMaintenance,
      ] = await Promise.all([
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
        SupportTicket.find({ clientId, status: 1 })
          .sort({ createdAt: -1 })
          .limit(5)
          .select("ticketNo clientId description ticketStatus createdAt")
          .populate("clientId", "companyName")
          .lean(),
        JobCard.find({ clientId, status: 1 })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("clientId", "companyName")
          .lean(),
        SupportTicket.aggregate([
          { $match: { clientId: clientObjId, status: 1 } },
          { $group: { _id: "$ticketStatus", count: { $sum: 1 } } },
        ]),
        JobCard.aggregate([
          { $match: { clientId: clientObjId, status: 1 } },
          { $group: { _id: "$jobCardStatus", count: { $sum: 1 } } },
        ]),
        ClientContact.countDocuments({ clientId }),
        User.countDocuments({ clientId, role: { $in: [4, 6] }, status: 1 }),
        ClientAssetLogMaintenance.countDocuments({
          clientAssetId: { $in: clientAssetIds },
        }),
        // Asset with most support tickets
        SupportTicket.aggregate([
          { $match: { clientId: clientObjId, status: 1, clientAssetId: { $ne: null } } },
          { $group: { _id: "$clientAssetId", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 },
          { $lookup: { from: "clientassets", localField: "_id", foreignField: "_id", as: "asset" } },
          { $unwind: { path: "$asset", preserveNullAndEmptyArrays: true } },
          { $project: { name: "$asset.machineName", count: 1 } },
        ]),
        // Next upcoming service (job card with future jobDate)
        JobCard.findOne({
          clientId,
          status: 1,
          jobDate: { $gte: new Date() },
          jobCardStatus: { $lt: 9 },
        })
          .sort({ jobDate: 1 })
          .populate("clientSiteId", "siteName")
          .lean(),
        // Upcoming services grouped by site (top 4)
        JobCard.aggregate([
          {
            $match: {
              clientId: clientObjId,
              status: 1,
              jobDate: { $gte: new Date() },
              $or: [{ jobCardStatus: { $lt: 8 } }, { jobCardStatus: null }],
              jobCardType: { $ne: null },
              clientSiteId: { $ne: null },
            },
          },
          { $sort: { jobDate: 1 } },
          { $group: { _id: "$clientSiteId", totalJobs: { $sum: 1 } } },
          { $lookup: { from: "clientsites", localField: "_id", foreignField: "_id", as: "site" } },
          { $unwind: { path: "$site", preserveNullAndEmptyArrays: true } },
          { $project: { siteName: "$site.siteName", totalJobs: 1 } },
          { $sort: { totalJobs: -1 } },
          { $limit: 4 },
        ]),
        // Asset with most maintenance logs
        ClientAssetLogMaintenance.aggregate([
          { $match: { clientAssetId: { $in: clientAssetIds } } },
          { $group: { _id: "$clientAssetId", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 },
          { $lookup: { from: "clientassets", localField: "_id", foreignField: "_id", as: "asset" } },
          { $unwind: { path: "$asset", preserveNullAndEmptyArrays: true } },
          { $project: { name: "$asset.machineName", count: 1 } },
        ]),
      ]);

      // Chart data: maintenance by month (current year) & by type (future jobs)
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear + 1, 0, 1);
      const jobCardBaseMatch = {
        clientId: clientObjId,
        status: { $nin: [15, 20] },
        freshRecurringJob: null,
      };

      const [maintenanceByMonthRaw, maintenanceByTypeRaw] = await Promise.all([
        // Maintenance action per month — job cards in current year grouped by month
        JobCard.aggregate([
          {
            $match: {
              ...jobCardBaseMatch,
              jobDate: { $gte: yearStart, $lt: yearEnd },
            },
          },
          {
            $group: {
              _id: { $month: "$jobDate" },
              count: { $sum: 1 },
            },
          },
        ]),
        // Maintenance action breakdown by type — future job cards with type, grouped
        JobCard.aggregate([
          {
            $match: {
              ...jobCardBaseMatch,
              jobDate: { $gte: new Date() },
              jobCardType: { $ne: null },
            },
          },
          {
            $group: { _id: "$jobCardType", count: { $sum: 1 } },
          },
          {
            $lookup: {
              from: "jobcardtypes",
              localField: "_id",
              foreignField: "_id",
              as: "type",
            },
          },
          { $unwind: { path: "$type", preserveNullAndEmptyArrays: true } },
          { $project: { title: "$type.title", count: 1 } },
          { $sort: { count: -1 } },
        ]),
      ]);

      // Build 12-month array (index 0 = Jan, 11 = Dec)
      const maintenanceByMonth = Array.from({ length: 12 }, () => 0);
      for (const row of maintenanceByMonthRaw) {
        maintenanceByMonth[row._id - 1] = row.count;
      }

      // Total maintenance actions = sum of type counts (matches PHP logic)
      const totalActions = maintenanceByTypeRaw.reduce(
        (s: number, r: any) => s + r.count,
        0
      );

      return successResponse({
        isPortal: true,
        sites,
        assets,
        openTickets,
        openJobCards,
        recentTickets,
        recentJobCards,
        ticketsByStatus,
        jobCardsByStatus,
        contacts,
        activeUsers,
        totalMaintenanceActions: totalActions,
        machineWithMostInteractions: assetWithMostTickets?.[0]?.name || null,
        nextServiceDate: nextService?.jobDate || null,
        nextServiceSite: (nextService?.clientSiteId as any)?.siteName || null,
        upcomingServiceSites,
        mostMaintenanceActions: assetWithMostMaintenance?.[0]?.name || null,
        maintenanceByMonth,
        maintenanceByType: maintenanceByTypeRaw.map((r: any) => ({
          title: r.title || "Unknown",
          count: r.count,
        })),
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
