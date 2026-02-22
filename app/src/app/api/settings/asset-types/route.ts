import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import AssetType from "@/models/AssetType";

export async function GET() {
  try {
    await dbConnect();
    const assetTypes = await AssetType.find().sort({ createdAt: -1 }).lean();
    return successResponse(assetTypes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    await requireAdmin();

    const body = await req.json();
    const { title } = body;

    if (!title) {
      return errorResponse("Title is required");
    }

    const assetType = await AssetType.create({
      title,
      dateTime: new Date(),
    });

    return successResponse(assetType, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
