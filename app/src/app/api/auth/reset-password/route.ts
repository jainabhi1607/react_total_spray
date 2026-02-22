import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";
import User from "@/models/User";
import UserDetail from "@/models/UserDetail";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { token, password } = await req.json();

    if (!token || !password) {
      return errorResponse("Token and password are required");
    }

    const userDetail = await UserDetail.findOne({ resetToken: token });

    if (!userDetail) {
      return errorResponse("Invalid or expired reset token", 400);
    }

    const user = await User.findById(userDetail.userId);

    if (!user) {
      return errorResponse("User not found", 404);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    await user.save();

    userDetail.resetToken = undefined;
    await userDetail.save();

    return successResponse({
      message: "Password has been reset successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
