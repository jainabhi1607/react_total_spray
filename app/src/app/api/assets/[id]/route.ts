import crypto from "crypto";
import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ClientAsset from "@/models/ClientAsset";
import SupportTicket from "@/models/SupportTicket";
import JobCardClientAsset from "@/models/JobCardClientAsset";
import JobCard from "@/models/JobCard";
import "@/models/Client";
import "@/models/ClientSite";
import "@/models/AssetMake";
import "@/models/AssetModel";
import "@/models/JobCardType";
import "@/models/ClientContact";
import "@/models/User";

function generatePublicCode(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id } = await params;

    const asset = await ClientAsset.findById(id)
      .populate("clientId", "companyName")
      .populate("clientSiteId", "siteName")
      .populate("assetMakeId", "title")
      .populate("assetModelId", "title");

    if (!asset) {
      return errorResponse("Asset not found", 404);
    }

    // Portal users can only view their own client's assets
    if ([4, 6].includes(session.role) && session.clientId) {
      if (asset.clientId?._id?.toString() !== session.clientId) {
        return errorResponse("Forbidden", 403);
      }
    }

    // Auto-generate publicCode for existing assets that don't have one
    if (!asset.publicCode) {
      const code = generatePublicCode();
      await ClientAsset.findByIdAndUpdate(id, { publicCode: code });
      asset.publicCode = code;
    }

    // Fetch support tickets, job card assignments, and counts in parallel
    const [supportTickets, jcAssets] = await Promise.all([
      SupportTicket.find({ clientAssetId: id, status: { $ne: 2 } })
        .populate("clientContactId", "name lastName")
        .populate("userId", "name lastName")
        .sort({ createdAt: -1 })
        .lean(),
      JobCardClientAsset.find({ clientAssetId: id })
        .select("jobCardId")
        .lean(),
    ]);

    const supportRequests = supportTickets.length;

    // Fetch job cards for this asset
    let jobCards: any[] = [];
    let lastServiceDate = null;
    if (jcAssets.length > 0) {
      const jobCardIds = jcAssets.map((a: any) => a.jobCardId);
      jobCards = await JobCard.find({
        _id: { $in: jobCardIds },
        status: { $ne: 2 },
        recurringJob: { $ne: 1 },
      })
        .populate("jobCardType", "title")
        .sort({ createdAt: -1 })
        .lean();

      // Find last service date
      const withDate = jobCards.filter((jc: any) => jc.jobDate);
      if (withDate.length > 0) {
        withDate.sort((a: any, b: any) => new Date(b.jobDate).getTime() - new Date(a.jobDate).getTime());
        lastServiceDate = withDate[0].jobDate;
      }
    }

    return successResponse({
      ...asset.toObject(),
      supportRequests,
      lastServiceDate,
      jobCards,
      supportTickets,
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
    const asset = await ClientAsset.findById(id);
    if (!asset) {
      return errorResponse("Asset not found", 404);
    }

    // Portal users can only update their own client's assets
    if ([4, 6].includes(session.role) && session.clientId) {
      if (asset.clientId?.toString() !== session.clientId) {
        return errorResponse("Forbidden", 403);
      }
    }

    const { notes, image } = body;

    if (notes !== undefined) {
      asset.notes = notes;
      asset.notesEditDateTime = new Date();
    }

    if (image !== undefined) {
      asset.image = image;
    }

    await asset.save();
    return successResponse(asset);
  } catch (error) {
    return handleApiError(error);
  }
}
