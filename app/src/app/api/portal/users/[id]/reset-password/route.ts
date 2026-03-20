import { NextRequest } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import User from "@/models/User";
import UserDetail from "@/models/UserDetail";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();

    if (session.role !== 4 || !session.clientId) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;

    const user = await User.findOne({
      _id: id,
      clientId: session.clientId,
      role: { $in: [4, 6] },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    await UserDetail.findOneAndUpdate(
      { userId: user._id },
      { resetToken },
      { upsert: true, new: true }
    );

    await sendPasswordResetEmail(user.email, resetToken, user.name);

    return successResponse({
      message: "Password reset link sent successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
