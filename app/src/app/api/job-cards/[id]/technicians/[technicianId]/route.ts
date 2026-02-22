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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; technicianId: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id, technicianId } = await params;

    const technician = await JobCardTechnician.findOne({
      _id: technicianId,
      jobCardId: id,
    });

    if (!technician) {
      return errorResponse("Technician assignment not found", 404);
    }

    await JobCardTechnician.deleteOne({ _id: technicianId });

    // Log the removal
    await JobCardLog.create({
      jobCardId: id,
      userId: session.id,
      task: "Technician removed from job card",
      dateTime: new Date(),
    });

    return successResponse({ message: "Technician removed successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
