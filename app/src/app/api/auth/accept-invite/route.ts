import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";
import User from "@/models/User";
import UserDetail from "@/models/UserDetail";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { token, name, lastName, password, phone } = await req.json();

    if (!token || !name || !password) {
      return errorResponse("Token, name, and password are required");
    }

    const userDetail = await UserDetail.findOne({ authcode: token });

    if (!userDetail) {
      return errorResponse("Invalid invitation token", 400);
    }

    const user = await User.findById(userDetail.userId);

    if (!user) {
      return errorResponse("User not found", 404);
    }

    if (user.status !== 25) {
      return errorResponse("This invitation has already been accepted", 400);
    }

    if (
      userDetail.invitationExpiryDate &&
      new Date(userDetail.invitationExpiryDate) < new Date()
    ) {
      return errorResponse("Invitation has expired", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.name = name;
    user.lastName = lastName || "";
    user.phone = phone || "";
    user.password = hashedPassword;
    user.status = 1;
    await user.save();

    userDetail.authcode = undefined;
    await userDetail.save();

    return successResponse({
      message: "Invitation accepted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
