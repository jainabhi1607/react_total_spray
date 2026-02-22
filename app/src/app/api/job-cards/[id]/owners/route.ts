import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import JobCardOwner from "@/models/JobCardOwner";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id } = await params;

    const owners = await JobCardOwner.find({ jobCardId: id })
      .populate("userId", "name email")
      .lean();

    return successResponse(owners);
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
    const { userId } = body;

    if (!userId) {
      return errorResponse("User ID is required");
    }

    // Check if owner is already assigned
    const existing = await JobCardOwner.findOne({
      jobCardId: id,
      userId,
    });

    if (existing) {
      return errorResponse("User is already an owner of this job card");
    }

    const owner = await JobCardOwner.create({
      jobCardId: id,
      userId,
      addedBy: session.id,
      dateTime: new Date(),
    });

    return successResponse(owner, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
