import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";
import User from "@/models/User";
import UserLoginCode from "@/models/UserLoginCode";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { userId, otp } = await req.json();

    if (!userId || !otp) {
      return errorResponse("User ID and OTP are required");
    }

    const loginCode = await UserLoginCode.findOne({
      userId,
      otp: Number(otp),
      expiryTime: { $gt: new Date() },
      status: 1,
    });

    if (!loginCode) {
      return errorResponse("Invalid or expired OTP", 400);
    }

    loginCode.status = 0;
    await loginCode.save();

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return errorResponse("User not found", 404);
    }

    return successResponse({
      message: "OTP verified successfully",
      user,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
