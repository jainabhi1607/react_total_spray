import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
  getSearchParams,
  paginatedResponse,
} from "@/lib/api-helpers";
import Client from "@/models/Client";
import ClientDetail from "@/models/ClientDetail";
import { generateAccessToken } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { page, limit, skip, search, status } = getSearchParams(req);

    const query: Record<string, any> = {};

    // Client users can only see their own client
    if ([4, 6].includes(session.role)) {
      if (!session.clientId) {
        return errorResponse("No client associated with this account", 403);
      }
      query._id = session.clientId;
    }

    // Search by company name
    if (search) {
      query.companyName = { $regex: search, $options: "i" };
    }

    // Filter by status
    if (status !== undefined) {
      query.status = status;
    } else {
      query.status = { $ne: 2 };
    }

    const [clients, total] = await Promise.all([
      Client.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Client.countDocuments(query),
    ]);

    return paginatedResponse(clients, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    await requireAdmin();

    const body = await req.json();
    const { companyName, address, abn, singleSite } = body;

    if (!companyName) {
      return errorResponse("Company name is required");
    }

    const accessToken = generateAccessToken();

    const client = await Client.create({
      companyName,
      address,
      abn,
      singleSite,
      accessToken,
      dateTime: new Date(),
      status: 1,
    });

    // Create associated ClientDetail record
    await ClientDetail.create({
      clientId: client._id,
    });

    return successResponse(client, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
