import { NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";
import { auth } from "@/lib/auth";
import User from "@/models/User";
import UserLoginCode from "@/models/UserLoginCode";
import { sendOtpEmail } from "@/lib/email";
import crypto from "crypto";

const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds between resends

function generateOtp(): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return 100000 + (array[0] % 900000);
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { userId } = await req.json();

    if (!userId) {
      return errorResponse("User ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return errorResponse("Invalid user ID", 400);
    }

    // Require a valid session — no anonymous OTP resend
    const session = await auth();
    const sessionUserId = (session?.user as any)?.id;
    if (!sessionUserId) {
      return errorResponse("Unauthorized", 401);
    }
    if (sessionUserId !== userId) {
      return errorResponse("Forbidden", 403);
    }

    const user = await User.findById(userId);

    if (!user) {
      return errorResponse("User not found", 404);
    }

    // Cooldown: check if an OTP was recently created
    const recentOtp = await UserLoginCode.findOne({
      userId: user._id,
      status: 1,
      createdAt: { $gt: new Date(Date.now() - RESEND_COOLDOWN_MS) },
    });

    if (recentOtp) {
      return errorResponse("Please wait before requesting a new code", 429);
    }

    // Invalidate any existing OTPs
    await UserLoginCode.updateMany(
      { userId: user._id, status: 1 },
      { status: 0 }
    );

    const otp = generateOtp();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

    await UserLoginCode.create({
      userId: user._id,
      otp,
      expiryTime,
      status: 1,
    });

    // Send OTP via email
    await sendOtpEmail(user.email, otp, user.name);

    return successResponse({
      message: "OTP sent successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
