import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
  enforcePortalScope,
} from "@/lib/api-helpers";
import JobCard from "@/models/JobCard";
import JobCardAttachment from "@/models/JobCardAttachment";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id } = await params;
    const jobCard = await JobCard.findById(id).select("clientId").lean();
    if (!jobCard) return errorResponse("Not found", 404);
    enforcePortalScope(session, (jobCard as any).clientId);

    const attachQuery: Record<string, any> = { jobCardId: id };
    // Portal users only see public attachments
    if ([4, 6].includes(session.role)) {
      attachQuery.visibility = 2;
    }

    const attachments = await JobCardAttachment.find(attachQuery)
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(attachments);
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
    const { id } = await params;
    const jobCard = await JobCard.findById(id).select("clientId").lean();
    if (!jobCard) return errorResponse("Not found", 404);
    enforcePortalScope(session, (jobCard as any).clientId);

    const body = await req.json();
    if (body.visibility !== undefined) {
      await JobCardAttachment.updateMany(
        { jobCardId: id },
        { $set: { visibility: body.visibility } }
      );
    }

    return successResponse({ message: "Attachments updated" });
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
    const session = await requireAuth();
    const { id } = await params;
    const jobCard = await JobCard.findById(id).select("clientId").lean();
    if (!jobCard) return errorResponse("Not found", 404);
    enforcePortalScope(session, (jobCard as any).clientId);

    const body = await req.json();
    const { documentName, fileName, fileSize, visibility } = body;

    const attachment = await JobCardAttachment.create({
      jobCardId: id,
      userId: session.id,
      documentName,
      fileName,
      fileSize,
      visibility,
      dateTime: new Date(),
    });

    return successResponse(attachment, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
