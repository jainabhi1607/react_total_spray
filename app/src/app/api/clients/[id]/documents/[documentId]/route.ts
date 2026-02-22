import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ClientDocument from "@/models/ClientDocument";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    await dbConnect();
    await requireAdmin();
    const { id, documentId } = await params;

    const document = await ClientDocument.findOneAndDelete({
      _id: documentId,
      clientId: id,
    });

    if (!document) {
      return errorResponse("Document not found", 404);
    }

    return successResponse({ message: "Document deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
