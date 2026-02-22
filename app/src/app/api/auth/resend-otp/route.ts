import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";
import User from "@/models/User";
import UserLoginCode from "@/models/UserLoginCode";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { userId } = await req.json();

    if (!userId) {
      return errorResponse("User ID is required");
    }

    const user = await User.findById(userId);

    if (!user) {
      return errorResponse("User not found", 404);
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

    await UserLoginCode.create({
      userId: user._id,
      otp,
      expiryTime,
      status: 1,
    });

    return successResponse({
      message: "OTP generated successfully",
      otp,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
