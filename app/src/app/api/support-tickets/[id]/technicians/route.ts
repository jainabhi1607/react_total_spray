import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  handleApiError,
} from "@/lib/api-helpers";
import SupportTicketTechnician from "@/models/SupportTicketTechnician";
import SupportTicketLog from "@/models/SupportTicketLog";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();

    const { id } = await params;

    const technicians = await SupportTicketTechnician.find({
      supportTicketId: id,
    })
      .populate({
        path: "technicianId",
        select: "companyName email phone",
      })
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
    const { technicianId, onSite } = body;

    const technician = await SupportTicketTechnician.create({
      supportTicketId: id,
      technicianId,
      onSite,
      addedBy: session.id,
      dateTime: new Date(),
    });

    await SupportTicketLog.create({
      supportTicketId: id,
      userId: session.id,
      task: "Technician assigned to ticket",
      dateTime: new Date(),
    });

    return successResponse(technician, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
