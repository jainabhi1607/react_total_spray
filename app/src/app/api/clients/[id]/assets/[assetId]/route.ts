import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ClientAsset from "@/models/ClientAsset";
import ClientAssetAttachment from "@/models/ClientAssetAttachment";
import ClientAssetComment from "@/models/ClientAssetComment";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id, assetId } = await params;

    // Client users can only view their own client's assets
    if ([4, 6].includes(session.role)) {
      if (session.clientId !== id) {
        return errorResponse("Forbidden", 403);
      }
    }

    const asset = await ClientAsset.findOne({
      _id: assetId,
      clientId: id,
    }).lean();

    if (!asset) {
      return errorResponse("Asset not found", 404);
    }

    const [attachments, comments] = await Promise.all([
      ClientAssetAttachment.find({ clientAssetId: assetId })
        .sort({ createdAt: -1 })
        .lean(),
      ClientAssetComment.find({ clientAssetId: assetId })
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return successResponse({ ...asset, attachments, comments });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id, assetId } = await params;

    const body = await req.json();
    const {
      machineName,
      serialNo,
      clientSiteId,
      assetTypeId,
      assetMakeId,
      assetModelId,
      image,
      notes,
      status,
    } = body;

    const asset = await ClientAsset.findOne({ _id: assetId, clientId: id });
    if (!asset) {
      return errorResponse("Asset not found", 404);
    }

    if (machineName !== undefined) asset.machineName = machineName;
    if (serialNo !== undefined) asset.serialNo = serialNo;
    if (clientSiteId !== undefined) asset.clientSiteId = clientSiteId;
    if (assetTypeId !== undefined) asset.assetTypeId = assetTypeId;
    if (assetMakeId !== undefined) asset.assetMakeId = assetMakeId;
    if (assetModelId !== undefined) asset.assetModelId = assetModelId;
    if (image !== undefined) asset.image = image;
    if (notes !== undefined) {
      asset.notes = notes;
      asset.notesEditDateTime = new Date();
    }
    if (status !== undefined) asset.status = status;

    await asset.save();

    return successResponse(asset);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id, assetId } = await params;

    const asset = await ClientAsset.findOne({ _id: assetId, clientId: id });
    if (!asset) {
      return errorResponse("Asset not found", 404);
    }

    // Soft delete
    asset.status = 2;
    await asset.save();

    return successResponse({ message: "Asset deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
