import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import AssetMake from "@/models/AssetMake";

export async function GET() {
  try {
    await dbConnect();
    const assetMakes = await AssetMake.find().sort({ createdAt: -1 }).lean();
    return successResponse(assetMakes);
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

    const assetMake = await AssetMake.create({
      title,
      dateTime: new Date(),
    });

    return successResponse(assetMake, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
