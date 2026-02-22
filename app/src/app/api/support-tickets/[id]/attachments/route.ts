import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  handleApiError,
} from "@/lib/api-helpers";
import SupportTicketAttachment from "@/models/SupportTicketAttachment";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();

    const { id } = await params;

    const attachments = await SupportTicketAttachment.find({
      supportTicketId: id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(attachments);
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
    const body = await req.json();
    const { documentName, fileName, fileSize, visibility } = body;

    const attachment = await SupportTicketAttachment.create({
      supportTicketId: id,
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
