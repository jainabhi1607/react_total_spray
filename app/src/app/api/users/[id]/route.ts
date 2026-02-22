import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import User from "@/models/User";
import UserDetail from "@/models/UserDetail";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id } = await params;

    const user = await User.findById(id).select("-password").lean();
    if (!user) {
      return errorResponse("User not found", 404);
    }

    const userDetail = await UserDetail.findOne({ userId: id }).lean();

    return successResponse({ ...user, userDetail });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const { name, lastName, email, password, phone, position, role, clientId, status } =
      body;

    const user = await User.findById(id);
    if (!user) {
      return errorResponse("User not found", 404);
    }

    // If email changed, check uniqueness
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return errorResponse("A user with this email already exists");
      }
      user.email = email;
    }

    if (name !== undefined) user.name = name;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (position !== undefined) user.position = position;
    if (role !== undefined) user.role = role;
    if (clientId !== undefined) user.clientId = clientId;
    if (status !== undefined) user.status = status;

    // If password provided, hash it
    if (password) {
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id } = await params;

    const user = await User.findById(id);
    if (!user) {
      return errorResponse("User not found", 404);
    }

    // Soft delete
    user.status = 2;
    await user.save();

    return successResponse({ message: "User deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
