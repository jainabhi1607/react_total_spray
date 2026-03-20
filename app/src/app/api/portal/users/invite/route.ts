import { NextRequest } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import User from "@/models/User";
import UserDetail from "@/models/UserDetail";
import { sendInviteEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await requireAuth();

    // Only portal administrators can invite
    if (session.role !== 4 || !session.clientId) {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return errorResponse("Email is required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return errorResponse("A user with this email already exists");
    }

    // Create user with invited status
    const user = await User.create({
      email: normalizedEmail,
      name: normalizedEmail.split("@")[0],
      password: crypto.randomBytes(32).toString("hex"), // temporary password
      role: 6, // Client User
      status: 25, // Invited
      clientId: session.clientId,
    });

    // Generate authcode for invite
    const authcode = crypto.randomBytes(32).toString("hex");
    const invitationExpiryDate = new Date();
    invitationExpiryDate.setDate(invitationExpiryDate.getDate() + 7);

    await UserDetail.create({
      userId: user._id,
      authcode,
      invitationExpiryDate,
    });

    // Send invitation email
    const inviterName = session.name || "An administrator";
    await sendInviteEmail(normalizedEmail, authcode, inviterName);

    return successResponse({
      message: "Invitation sent successfully",
      user: { _id: user._id, email: user.email, status: user.status },
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
