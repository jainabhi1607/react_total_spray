import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ServiceAgreement from "@/models/ServiceAgreement";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id } = await params;

    // Client users can only view their own client's agreements
    if ([4, 6].includes(session.role)) {
      if (session.clientId !== id) {
        return errorResponse("Forbidden", 403);
      }
    }

    const agreements = await ServiceAgreement.find({ clientId: id })
      .sort({ createdAt: -1 })
      .lean();

    // Auto-expire active agreements past endDate
    const now = new Date();
    const expireIds: string[] = [];
    for (const ag of agreements) {
      if (ag.status === 1 && ag.endDate && new Date(ag.endDate) < now) {
        expireIds.push(String(ag._id));
        ag.status = 2;
      }
    }
    if (expireIds.length > 0) {
      await ServiceAgreement.updateMany(
        { _id: { $in: expireIds } },
        { $set: { status: 2 } }
      );
    }

    return successResponse(agreements);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const {
      title,
      agreementNumber,
      serviceType,
      frequency,
      startDate,
      endDate,
      status,
      coveredSiteIds,
      contractValue,
      billingFrequency,
      notes,
      document,
    } = body;

    if (!title) {
      return errorResponse("Title is required");
    }

    const agreement = await ServiceAgreement.create({
      clientId: id,
      title,
      agreementNumber,
      serviceType,
      frequency,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status: status || 3,
      coveredSiteIds: coveredSiteIds || [],
      contractValue,
      billingFrequency,
      notes,
      document,
      dateTime: new Date(),
    });

    return successResponse(agreement, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
