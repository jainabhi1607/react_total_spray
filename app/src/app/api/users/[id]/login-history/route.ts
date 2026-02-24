import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import User from "@/models/User";
import UserLoginIpAddress from "@/models/UserLoginIpAddress";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id } = await params;

    const user = await User.findById(id);
    if (!user) {
      return errorResponse("User not found", 404);
    }

    const logins = await UserLoginIpAddress.find({ userId: id })
      .sort({ dateTime: -1 })
      .limit(50)
      .lean();

    return successResponse(logins);
  } catch (error) {
    return handleApiError(error);
  }
}
