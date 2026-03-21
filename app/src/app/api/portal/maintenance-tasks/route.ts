import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import MaintenanceTask from "@/models/MaintenanceTask";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
  getSearchParams,
  paginatedResponse,
} from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (![4].includes(session.role)) {
      return errorResponse("Forbidden", 403);
    }
    await dbConnect();

    const { page, limit, skip, search } = getSearchParams(req);

    const filter: any = { clientId: session.clientId };
    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const [data, total] = await Promise.all([
      MaintenanceTask.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      MaintenanceTask.countDocuments(filter),
    ]);

    return paginatedResponse(data, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (![4].includes(session.role)) {
      return errorResponse("Forbidden", 403);
    }
    await dbConnect();

    const { title } = await req.json();
    if (!title?.trim()) {
      return errorResponse("Task name is required");
    }

    const task = await MaintenanceTask.create({
      clientId: session.clientId,
      title: title.trim(),
    });

    return successResponse(task, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
