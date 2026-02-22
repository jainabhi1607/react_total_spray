import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import SupportTicketTechnician from "@/models/SupportTicketTechnician";
import SupportTicketLog from "@/models/SupportTicketLog";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; technicianId: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();

    const { technicianId } = await params;

    const technician =
      await SupportTicketTechnician.findByIdAndDelete(technicianId);

    if (!technician) {
      return errorResponse("Technician assignment not found", 404);
    }

    await SupportTicketLog.create({
      supportTicketId: technician.supportTicketId,
      userId: session.id,
      task: "Technician removed from ticket",
      dateTime: new Date(),
    });

    return successResponse({ message: "Technician removed" });
  } catch (error) {
    return handleApiError(error);
  }
}
