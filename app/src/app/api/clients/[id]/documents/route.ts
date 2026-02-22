import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ClientDocument from "@/models/ClientDocument";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id } = await params;

    // Client users can only view their own client's documents
    if ([4, 6].includes(session.role)) {
      if (session.clientId !== id) {
        return errorResponse("Forbidden", 403);
      }
    }

    const documents = await ClientDocument.find({ clientId: id })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(documents);
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
    const session = await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const { documentName, fileName, fileSize } = body;

    if (!documentName) {
      return errorResponse("Document name is required");
    }

    const document = await ClientDocument.create({
      clientId: id,
      userId: session.id,
      documentName,
      fileName,
      fileSize,
      dateTime: new Date(),
    });

    return successResponse(document, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
