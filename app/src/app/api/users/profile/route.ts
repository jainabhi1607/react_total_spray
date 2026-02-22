import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import User from "@/models/User";
import UserDetail from "@/models/UserDetail";

export async function GET() {
  try {
    await dbConnect();
    const session = await requireAuth();

    const user = await User.findById(session.id).select("-password").lean();
    if (!user) {
      return errorResponse("User not found", 404);
    }

    const userDetail = await UserDetail.findOne({ userId: session.id }).lean();

    return successResponse({ ...user, userDetail });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const session = await requireAuth();

    const body = await req.json();
    const { name, lastName, phone, position, password, currentPassword } = body;

    const user = await User.findById(session.id);
    if (!user) {
      return errorResponse("User not found", 404);
    }

    if (name !== undefined) user.name = name;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (position !== undefined) user.position = position;

    // If password update requested, verify current password
    if (password) {
      if (!currentPassword) {
        return errorResponse("Current password is required to update password");
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return errorResponse("Current password is incorrect");
      }

      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    const userObj = user.toObject();
    const { password: _, ...userWithoutPassword } = userObj;

    return successResponse(userWithoutPassword);
  } catch (error) {
    return handleApiError(error);
  }
}
