import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import UserGroup from "@/models/UserGroup";
import UserGroupUser from "@/models/UserGroupUser";

export async function GET() {
  try {
    await dbConnect();
    const session = await requireAuth();

    if (session.role !== 4 || !session.clientId) {
      return errorResponse("Forbidden", 403);
    }

    const groups = await UserGroup.find({ userId: session.clientId })
      .sort({ defaultGroup: -1, title: 1 })
      .lean();

    // Attach user count per group
    const groupIds = groups.map((g: any) => g._id);
    const counts = await UserGroupUser.aggregate([
      { $match: { userGroupId: { $in: groupIds } } },
      { $group: { _id: "$userGroupId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c: any) => [String(c._id), c.count]));

    const result = groups.map((g: any) => ({
      ...g,
      userCount: countMap.get(String(g._id)) || 0,
    }));

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await requireAuth();

    if (session.role !== 4 || !session.clientId) {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const { title } = body;

    if (!title || !title.trim()) {
      return errorResponse("Title is required");
    }

    const group = await UserGroup.create({
      userId: session.clientId,
      title: title.trim(),
      dateTime: new Date(),
    });

    return successResponse(group, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
