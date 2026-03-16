import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";
import User from "@/models/User";
import UserDetail from "@/models/UserDetail";
import Client from "@/models/Client";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const token = new URL(req.url).searchParams.get("token");
    if (!token) {
      return errorResponse("Token is required", 400);
    }

    const invalidMsg = "Invalid or expired invitation";

    const userDetail = await UserDetail.findOne({ authcode: token });
    if (!userDetail) {
      return errorResponse(invalidMsg, 400);
    }

    const user = await User.findById(userDetail.userId);
    if (!user || user.status !== 25) {
      return errorResponse(invalidMsg, 400);
    }

    if (
      userDetail.invitationExpiryDate &&
      new Date(userDetail.invitationExpiryDate) < new Date()
    ) {
      return errorResponse(invalidMsg, 400);
    }

    // Fetch client company name
    let companyName = "";
    if (user.clientId) {
      const client = await Client.findById(user.clientId).select("companyName").lean();
      if (client) {
        companyName = (client as any).companyName;
      }
    }

    return successResponse({
      email: user.email,
      companyName,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
