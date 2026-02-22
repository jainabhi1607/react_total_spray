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
import Technician from "@/models/Technician";
import TechnicianDetail from "@/models/TechnicianDetail";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    await requireAuth();
    const { page, limit, skip, search } = getSearchParams(req);

    const query: Record<string, any> = {
      status: { $ne: 2 },
    };

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [technicians, total] = await Promise.all([
      Technician.find(query)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Technician.countDocuments(query),
    ]);

    return paginatedResponse(technicians, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    await requireAdmin();

    const body = await req.json();
    const { companyName, licenceNumber, licenceExpiry, abn, email, phone, address } = body;

    if (!companyName) {
      return errorResponse("Company name is required");
    }

    const technician = await Technician.create({
      companyName,
      licenceNumber,
      licenceExpiry,
      abn,
      email,
      phone,
      address,
      dateTime: new Date(),
      status: 1,
    });

    await TechnicianDetail.create({
      technicianId: technician._id,
    });

    return successResponse(technician, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
