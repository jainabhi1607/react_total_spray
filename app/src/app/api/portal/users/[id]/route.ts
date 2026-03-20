import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import User from "@/models/User";
import UserLoginIpAddress from "@/models/UserLoginIpAddress";

export async function GET(
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

    const [user, loginHistory] = await Promise.all([
      User.findOne({
        _id: id,
        clientId: session.clientId,
        role: { $in: [4, 6] },
      })
        .select("name lastName email phone position role status createdAt updatedAt")
        .lean(),
      UserLoginIpAddress.find({ userId: id })
        .select("ipAddress city dateTime loginResponse")
        .sort({ dateTime: -1 })
        .limit(50)
        .lean(),
    ]);

    if (!user) {
      return errorResponse("User not found", 404);
    }

    return successResponse({ ...user, loginHistory });
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
    const session = await requireAuth();

    if (session.role !== 4 || !session.clientId) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;
    const body = await req.json();
    const { name, lastName, email, phone, position, role, status } = body;

    // Verify user belongs to same client
    const existing = await User.findOne({
      _id: id,
      clientId: session.clientId,
      role: { $in: [4, 6] },
    });

    if (!existing) {
      return errorResponse("User not found", 404);
    }

    const update: Record<string, any> = {};
    if (name !== undefined) update.name = name;
    if (lastName !== undefined) update.lastName = lastName;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (position !== undefined) update.position = position;
    if (role !== undefined && [4, 6].includes(role)) update.role = role;
    if (status !== undefined && [0, 1].includes(status)) update.status = status;

    const user = await User.findByIdAndUpdate(id, update, { new: true })
      .select("name lastName email phone position role status createdAt updatedAt")
      .lean();

    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}
