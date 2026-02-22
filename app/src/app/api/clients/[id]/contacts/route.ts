import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ClientContact from "@/models/ClientContact";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();
    const { id } = await params;

    // Client users can only view their own client's contacts
    if ([4, 6].includes(session.role)) {
      if (session.clientId !== id) {
        return errorResponse("Forbidden", 403);
      }
    }

    const contacts = await ClientContact.find({ clientId: id })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(contacts);
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
    const { name, lastName, position, email, phone, clientSiteId } = body;

    if (!name) {
      return errorResponse("Contact name is required");
    }

    const contact = await ClientContact.create({
      clientId: id,
      name,
      lastName,
      position,
      email,
      phone,
      clientSiteId,
      dateTime: new Date(),
    });

    return successResponse(contact, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
