import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import SupportTicketTime from "@/models/SupportTicketTime";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; timeId: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();

    const { timeId } = await params;
    const body = await req.json();

    const timeEntry = await SupportTicketTime.findByIdAndUpdate(
      timeId,
      body,
      { new: true, runValidators: true }
    );

    if (!timeEntry) {
      return errorResponse("Time entry not found", 404);
    }

    return successResponse(timeEntry);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; timeId: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();

    const { timeId } = await params;

    const timeEntry = await SupportTicketTime.findByIdAndDelete(timeId);

    if (!timeEntry) {
      return errorResponse("Time entry not found", 404);
    }

    return successResponse({ message: "Time entry deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
