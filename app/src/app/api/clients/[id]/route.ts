import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import Client from "@/models/Client";
import ClientDetail from "@/models/ClientDetail";
import { generateAccessToken } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id } = await params;

    // Client users can only view their own client
    if ([4, 6].includes(session.role)) {
      if (session.clientId !== id) {
        return errorResponse("Forbidden", 403);
      }
    }

    const client = await Client.findById(id).lean();
    if (!client) {
      return errorResponse("Client not found", 404);
    }

    const clientDetail = await ClientDetail.findOne({ clientId: id }).lean();

    return successResponse({ ...client, clientDetail });
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
    await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const { companyName, address, abn, singleSite, companyLogo, status, about, activateAccessToken, deactivateAccessToken } = body;

    const client = await Client.findById(id);
    if (!client) {
      return errorResponse("Client not found", 404);
    }

    if (companyName !== undefined) client.companyName = companyName;
    if (address !== undefined) client.address = address;
    if (abn !== undefined) client.abn = abn;
    if (singleSite !== undefined) client.singleSite = singleSite;
    if (companyLogo !== undefined) client.companyLogo = companyLogo;
    if (status !== undefined) client.status = status;
    if (activateAccessToken) client.accessToken = generateAccessToken();
    if (deactivateAccessToken) client.accessToken = "";

    await client.save();

    // Update ClientDetail.about if provided
    if (about !== undefined) {
      await ClientDetail.findOneAndUpdate(
        { clientId: id },
        { about },
        { upsert: true }
      );
    }

    return successResponse(client);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id } = await params;

    const client = await Client.findById(id);
    if (!client) {
      return errorResponse("Client not found", 404);
    }

    // Soft delete
    client.status = 2;
    await client.save();

    return successResponse({ message: "Client deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
