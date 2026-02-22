import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ClientSite from "@/models/ClientSite";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; siteId: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id, siteId } = await params;

    const body = await req.json();
    const { siteName, address, siteId: siteCode, status } = body;

    const site = await ClientSite.findOne({ _id: siteId, clientId: id });
    if (!site) {
      return errorResponse("Site not found", 404);
    }

    if (siteName !== undefined) site.siteName = siteName;
    if (address !== undefined) site.address = address;
    if (siteCode !== undefined) site.siteId = siteCode;
    if (status !== undefined) site.status = status;

    await site.save();

    return successResponse(site);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; siteId: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id, siteId } = await params;

    const site = await ClientSite.findOne({ _id: siteId, clientId: id });
    if (!site) {
      return errorResponse("Site not found", 404);
    }

    // Soft delete
    site.status = 2;
    await site.save();

    return successResponse({ message: "Site deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
