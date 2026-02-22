import { NextRequest } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import {
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import User from "@/models/User";
import UserDetail from "@/models/UserDetail";

export async function POST(
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

    // Generate authcode
    const authcode = crypto.randomBytes(32).toString("hex");
    const invitationExpiryDate = new Date();
    invitationExpiryDate.setDate(invitationExpiryDate.getDate() + 7);

    // Set user status to pending (25)
    user.status = 25;
    await user.save();

    // Update or create UserDetail with invite info
    let userDetail = await UserDetail.findOne({ userId: id });
    if (!userDetail) {
      userDetail = await UserDetail.create({
        userId: id,
        authcode,
        invitationExpiryDate,
      });
    } else {
      userDetail.authcode = authcode;
      userDetail.invitationExpiryDate = invitationExpiryDate;
      await userDetail.save();
    }

    return successResponse({
      message: "Invitation sent successfully",
      authcode,
      invitationExpiryDate,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
