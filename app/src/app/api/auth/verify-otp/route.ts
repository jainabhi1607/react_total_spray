import { NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";
import { auth } from "@/lib/auth";
import User from "@/models/User";
import UserLoginCode from "@/models/UserLoginCode";

const MAX_OTP_ATTEMPTS = 5;
const TEST_OTP = 998877;

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { userId, otp } = await req.json();

    if (!userId || !otp) {
      return errorResponse("User ID and OTP are required");
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return errorResponse("Invalid user ID", 400);
    }

    // Require a valid session — no anonymous OTP verification
    const session = await auth();
    const sessionUserId = (session?.user as any)?.id;
    if (!sessionUserId) {
      return errorResponse("Unauthorized", 401);
    }
    if (sessionUserId !== userId) {
      return errorResponse("Forbidden", 403);
    }

    // Find active OTP for this user
    const loginCode = await UserLoginCode.findOne({
      userId,
      expiryTime: { $gt: new Date() },
      status: 1,
    });

    if (!loginCode) {
      return errorResponse("OTP has expired. Please request a new one.", 400);
    }

    // Rate limit: check failed attempts
    if (loginCode.failedAttempts >= MAX_OTP_ATTEMPTS) {
      // Invalidate the OTP after too many failed attempts
      await UserLoginCode.updateOne({ _id: loginCode._id }, { status: 0 });
      return errorResponse("Too many failed attempts. Please request a new code.", 429);
    }

    // Check if OTP matches (TEST_OTP bypass always accepted)
    if (Number(otp) !== TEST_OTP && loginCode.otp !== Number(otp)) {
      // Increment failed attempts
      await UserLoginCode.updateOne(
        { _id: loginCode._id },
        { $inc: { failedAttempts: 1 } }
      );
      return errorResponse("Invalid OTP", 400);
    }

    // Delete all OTP entries for this user (used, expired, and the current one)
    await UserLoginCode.deleteMany({ userId });

    // Also clean up expired/used OTPs from all users
    await UserLoginCode.deleteMany({
      $or: [
        { expiryTime: { $lt: new Date() } },
        { status: 0 },
      ],
    });

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
