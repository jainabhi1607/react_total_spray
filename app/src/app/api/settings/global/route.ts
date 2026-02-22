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

    let settings = await GlobalSetting.findOne();
    if (!settings) {
      settings = await GlobalSetting.create(body);
    } else {
      Object.assign(settings, body);
      await settings.save();
    }

    return successResponse(settings);
  } catch (error) {
    return handleApiError(error);
  }
}
