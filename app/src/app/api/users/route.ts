import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
  getSearchParams,
  paginatedResponse,
} from "@/lib/api-helpers";
import User from "@/models/User";
import UserDetail from "@/models/UserDetail";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    await requireAdmin();

    const { page, limit, skip, search } = getSearchParams(req);
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    const query: Record<string, any> = { status: { $ne: 2 } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = parseInt(role);
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    // Join with UserDetail for profilePic
    const userIds = users.map((u: any) => u._id);
    const userDetails = await UserDetail.find({ userId: { $in: userIds } })
      .select("userId profilePic")
      .lean();

    const detailMap = new Map(
      userDetails.map((d: any) => [d.userId.toString(), d])
    );

    const usersWithDetails = users.map((user: any) => ({
      ...user,
      userDetail: detailMap.get(user._id.toString()) || null,
    }));

    return paginatedResponse(usersWithDetails, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    await requireAdmin();

    const body = await req.json();
    const { name, lastName, email, password, phone, position, role, clientId } =
      body;

    if (!name || !email || !password) {
      return errorResponse("Name, email, and password are required");
    }

    // Check email uniqueness
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse("A user with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      lastName,
      email,
      password: hashedPassword,
      phone,
      position,
      role,
      clientId,
      status: 1,
    });

    // Create associated UserDetail record
    await UserDetail.create({
      userId: user._id,
    });

    // Return user without password
    const userObj = user.toObject();
    const { password: _, ...userWithoutPassword } = userObj;

    return successResponse(userWithoutPassword, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
