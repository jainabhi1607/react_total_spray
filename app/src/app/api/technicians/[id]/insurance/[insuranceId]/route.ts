import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import TechnicianInsurance from "@/models/TechnicianInsurance";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; insuranceId: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id, insuranceId } = await params;

    const body = await req.json();
    const { insurancePolicyType, expiryDate, fileName, fileSize, groupNumber, status } = body;

    const insurance = await TechnicianInsurance.findOne({
      _id: insuranceId,
      technicianId: id,
    });

    if (!insurance) {
      return errorResponse("Insurance not found", 404);
    }

    if (insurancePolicyType !== undefined) insurance.insurancePolicyType = insurancePolicyType;
    if (expiryDate !== undefined) insurance.expiryDate = expiryDate;
    if (fileName !== undefined) insurance.fileName = fileName;
    if (fileSize !== undefined) insurance.fileSize = fileSize;
    if (groupNumber !== undefined) insurance.groupNumber = groupNumber;
    if (status !== undefined) insurance.status = status;

    await insurance.save();

    return successResponse(insurance);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; insuranceId: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id, insuranceId } = await params;

    const insurance = await TechnicianInsurance.findOneAndDelete({
      _id: insuranceId,
      technicianId: id,
    });

    if (!insurance) {
      return errorResponse("Insurance not found", 404);
    }

    return successResponse({ message: "Insurance deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
