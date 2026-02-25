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
import "@/models/Client";
import "@/models/ClientSite";
import "@/models/AssetMake";
import "@/models/AssetModel";

function generatePublicCode(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id } = await params;

    const asset = await ClientAsset.findById(id)
      .populate("clientId", "companyName")
      .populate("clientSiteId", "siteName")
      .populate("assetMakeId", "title")
      .populate("assetModelId", "title");

    if (!asset) {
      return errorResponse("Asset not found", 404);
    }

    // Auto-generate publicCode for existing assets that don't have one
    if (!asset.publicCode) {
      const code = generatePublicCode();
      await ClientAsset.findByIdAndUpdate(id, { publicCode: code });
      asset.publicCode = code;
    }

    // Count support requests for this asset
    const supportRequests = await SupportTicket.countDocuments({
      clientAssetId: id,
      status: { $ne: 2 },
    });

    return successResponse({ ...asset.toObject(), supportRequests });
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
    const asset = await ClientAsset.findById(id);
    if (!asset) {
      return errorResponse("Asset not found", 404);
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
