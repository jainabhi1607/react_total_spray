import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAdmin,
  successResponse,
  handleApiError,
} from "@/lib/api-helpers";
import GlobalSetting from "@/models/GlobalSetting";

export async function GET() {
  try {
    await dbConnect();
    await requireAdmin();

    let settings = await GlobalSetting.findOne().lean();
    if (!settings) {
      settings = await GlobalSetting.create({});
    }

    return successResponse(settings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    await requireAdmin();

    const body = await req.json();

    const allowedFields = [
      "newSignupEmailSubject", "newSignupEmailContent",
      "passwordRecoveryEmailSubject", "passwordRecoveryEmailContent",
      "sendgridApikey", "postmarkApikey", "googleApikey",
      "awsBucket", "awsAccountId", "awsAccessKeyId", "awsAccessKeySecret",
      "stripeApikey", "stripePublishKey",
      "technicianInvalidInsuranceNotificationEmails",
      "supportTicketAlertRecipients",
    ];
    const safeData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) safeData[field] = body[field];
    }

    let settings = await GlobalSetting.findOne();
    if (!settings) {
      settings = await GlobalSetting.create(safeData);
    } else {
      for (const [key, val] of Object.entries(safeData)) {
        (settings as any)[key] = val;
      }
      await settings.save();
    }

    return successResponse(settings);
  } catch (error) {
    return handleApiError(error);
  }
}
