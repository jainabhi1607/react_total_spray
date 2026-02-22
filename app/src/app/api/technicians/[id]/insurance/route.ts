import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import TechnicianInsurance from "@/models/TechnicianInsurance";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id } = await params;

    const insurances = await TechnicianInsurance.find({ technicianId: id })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(insurances);
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
    const session = await requireAuth();
    const { id } = await params;

    const body = await req.json();
    const { insurancePolicyType, expiryDate, fileName, fileSize, groupNumber } = body;

    const insurance = await TechnicianInsurance.create({
      technicianId: id,
      addedBy: session.id,
      insurancePolicyType,
      expiryDate,
      fileName,
      fileSize,
      groupNumber,
      dateTime: new Date(),
      status: 1,
    });

    return successResponse(insurance, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
