import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ClientSite from "@/models/ClientSite";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id } = await params;

    // Client users can only view their own client's sites
    if ([4, 6].includes(session.role)) {
      if (session.clientId !== id) {
        return errorResponse("Forbidden", 403);
      }
    }

    const sites = await ClientSite.find({
      clientId: id,
      status: { $ne: 2 },
    })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(sites);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const { siteName, address, siteId } = body;

    if (!siteName) {
      return errorResponse("Site name is required");
    }

    const site = await ClientSite.create({
      clientId: id,
      siteName,
      address,
      siteId,
      dateTime: new Date(),
      status: 1,
    });

    return successResponse(site, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
