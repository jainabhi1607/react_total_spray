import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import User from "@/models/User";

export async function GET() {
  try {
    await dbConnect();
    const session = await requireAuth();

    if (session.role !== 4 || !session.clientId) {
      return errorResponse("Forbidden", 403);
    }

    const users = await User.find({
      clientId: session.clientId,
      role: { $in: [4, 6] },
    })
      .select("name lastName email role status createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(users);
  } catch (error) {
    return handleApiError(error);
  }
}
