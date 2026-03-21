import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import MaintenanceTask from "@/models/MaintenanceTask";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    if (![4].includes(session.role)) {
      return errorResponse("Forbidden", 403);
    }
    await dbConnect();

    const { id } = await params;
    const { title } = await req.json();
    if (!title?.trim()) {
      return errorResponse("Task name is required");
    }

    const task = await MaintenanceTask.findOneAndUpdate(
      { _id: id, clientId: session.clientId },
      { title: title.trim() },
      { new: true }
    );

    if (!task) {
      return errorResponse("Task not found", 404);
    }

    return successResponse(task);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    if (![4].includes(session.role)) {
      return errorResponse("Forbidden", 403);
    }
    await dbConnect();

    const { id } = await params;
    const task = await MaintenanceTask.findOneAndDelete({
      _id: id,
      clientId: session.clientId,
    });

    if (!task) {
      return errorResponse("Task not found", 404);
    }

    return successResponse({ message: "Task deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
