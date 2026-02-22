import { NextRequest } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";
import User from "@/models/User";
import UserDetail from "@/models/UserDetail";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { email } = await req.json();

    if (!email) {
      return errorResponse("Email is required");
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      status: { $in: [1, 25] },
    });

    if (!user) {
      return errorResponse("No account found with that email address", 404);
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    await UserDetail.findOneAndUpdate(
      { userId: user._id },
      { resetToken },
      { upsert: true, new: true }
    );

    return successResponse({
      message: "Password reset token generated successfully",
      resetToken,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
