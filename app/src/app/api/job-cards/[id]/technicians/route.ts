import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import JobCardTechnician from "@/models/JobCardTechnician";
import JobCardLog from "@/models/JobCardLog";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id } = await params;

    const technicians = await JobCardTechnician.find({ jobCardId: id })
      .populate("technicianId")
      .lean();

    return successResponse(technicians);
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
    const { technicianId } = body;

    if (!technicianId) {
      return errorResponse("Technician ID is required");
    }

    // Check if technician is already assigned
    const existing = await JobCardTechnician.findOne({
      jobCardId: id,
      technicianId,
    });

    if (existing) {
      return errorResponse("Technician is already assigned to this job card");
    }

    const technician = await JobCardTechnician.create({
      jobCardId: id,
      technicianId,
      addedBy: session.id,
      dateTime: new Date(),
    });

    // Log the assignment
    await JobCardLog.create({
      jobCardId: id,
      userId: session.id,
      task: "Technician assigned to job card",
      dateTime: new Date(),
    });

    return successResponse(technician, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
