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
  { params }: { params: Promise<{ id: string; agreementId: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id, agreementId } = await params;

    if ([4, 6].includes(session.role)) {
      if (session.clientId !== id) {
        return errorResponse("Forbidden", 403);
      }
    }

    const agreement = await ServiceAgreement.findOne({
      _id: agreementId,
      clientId: id,
    }).lean();

    if (!agreement) {
      return errorResponse("Service agreement not found", 404);
    }

    return successResponse(agreement);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; agreementId: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id, agreementId } = await params;

    const body = await req.json();
    const agreement = await ServiceAgreement.findOne({
      _id: agreementId,
      clientId: id,
    });

    if (!agreement) {
      return errorResponse("Service agreement not found", 404);
    }

    const fields = [
      "title",
      "agreementNumber",
      "serviceType",
      "frequency",
      "startDate",
      "endDate",
      "status",
      "coveredSiteIds",
      "contractValue",
      "billingFrequency",
      "notes",
      "document",
    ] as const;

    for (const field of fields) {
      if (body[field] !== undefined) {
        (agreement as any)[field] = body[field];
      }
    }

    await agreement.save();

    return successResponse(agreement);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; agreementId: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id, agreementId } = await params;

    const agreement = await ServiceAgreement.findOne({
      _id: agreementId,
      clientId: id,
    });

    if (!agreement) {
      return errorResponse("Service agreement not found", 404);
    }

    await agreement.deleteOne();

    return successResponse({ message: "Service agreement deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
