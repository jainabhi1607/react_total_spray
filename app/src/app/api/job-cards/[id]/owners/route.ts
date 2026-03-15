import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
  getClientIp,
} from "@/lib/api-helpers";
import JobCardOwner from "@/models/JobCardOwner";
import JobCard from "@/models/JobCard";
import JobCardLog from "@/models/JobCardLog";
import User from "@/models/User";

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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id } = await params;

    const body = await req.json();
    const { userIds } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return errorResponse("userIds array is required");
    }

    // Remove all existing owners and replace with new ones
    await JobCardOwner.deleteMany({ jobCardId: id });

    const docs = userIds.map((userId: string) => ({
      jobCardId: id,
      userId,
      addedBy: session.id,
      dateTime: new Date(),
    }));

    await JobCardOwner.insertMany(docs);

    // Auto-set status to 3 (Assigned Technicians) if below that
    const jobCard = await JobCard.findById(id);
    if (jobCard && jobCard.jobCardStatus < 3) {
      jobCard.jobCardStatus = 3;
      await jobCard.save();
    }

    const owners = await JobCardOwner.find({ jobCardId: id })
      .populate("userId", "name email")
      .lean();

    // Log owner assignment
    const ownerUsers = await User.find({ _id: { $in: userIds } }).select("name lastName").lean();
    const ownerNames = ownerUsers.map((u: any) => `${u.name}${u.lastName ? " " + u.lastName : ""}`).join(", ");
    await JobCardLog.create({
      jobCardId: id,
      userId: session.id,
      task: `Job Card owners updated: ${ownerNames}`,
      dateTime: new Date(),
      ipAddress: getClientIp(req),
    });

    return successResponse(owners);
  } catch (error) {
    return handleApiError(error);
  }
}
