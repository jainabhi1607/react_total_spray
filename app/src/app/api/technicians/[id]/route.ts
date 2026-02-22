import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import Technician from "@/models/Technician";
import TechnicianDetail from "@/models/TechnicianDetail";
import TechnicianInsurance from "@/models/TechnicianInsurance";
import TechnicianTag from "@/models/TechnicianTag";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id } = await params;

    const technician = await Technician.findById(id)
      .populate("userId", "name email")
      .lean();

    if (!technician) {
      return errorResponse("Technician not found", 404);
    }

    const [technicianDetail, insurances, tags] = await Promise.all([
      TechnicianDetail.findOne({ technicianId: id }).lean(),
      TechnicianInsurance.find({ technicianId: id }).sort({ createdAt: -1 }).lean(),
      TechnicianTag.find({ technicianId: id }).populate("tagId").lean(),
    ]);

    return successResponse({
      ...technician,
      technicianDetail,
      insurances,
      tags,
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
    await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const { companyName, licenceNumber, licenceExpiry, abn, email, phone, address, status } = body;

    const technician = await Technician.findById(id);
    if (!technician) {
      return errorResponse("Technician not found", 404);
    }

    if (companyName !== undefined) technician.companyName = companyName;
    if (licenceNumber !== undefined) technician.licenceNumber = licenceNumber;
    if (licenceExpiry !== undefined) technician.licenceExpiry = licenceExpiry;
    if (abn !== undefined) technician.abn = abn;
    if (email !== undefined) technician.email = email;
    if (phone !== undefined) technician.phone = phone;
    if (address !== undefined) technician.address = address;
    if (status !== undefined) technician.status = status;

    await technician.save();

    return successResponse(technician);
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

    const technician = await Technician.findById(id);
    if (!technician) {
      return errorResponse("Technician not found", 404);
    }

    // Soft delete
    technician.status = 2;
    await technician.save();

    return successResponse({ message: "Technician deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
