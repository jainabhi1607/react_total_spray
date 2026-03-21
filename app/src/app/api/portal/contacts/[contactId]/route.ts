import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import ClientContact from "@/models/ClientContact";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();

    if (![4, 6].includes(session.role) || !session.clientId) {
      return errorResponse("Forbidden", 403);
    }

    const { contactId } = await params;

    const contact = await ClientContact.findOne({
      _id: contactId,
      clientId: session.clientId,
    });
    if (!contact) {
      return errorResponse("Contact not found", 404);
    }

    const body = await req.json();
    const { name, lastName, position, email, phone, clientSiteId } = body;

    if (name !== undefined) contact.name = name;
    if (lastName !== undefined) contact.lastName = lastName;
    if (position !== undefined) contact.position = position;
    if (email !== undefined) contact.email = email;
    if (phone !== undefined) contact.phone = phone;
    if (clientSiteId !== undefined) contact.clientSiteId = clientSiteId;

    await contact.save();

    return successResponse(contact);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    await dbConnect();
    const session = await requireAuth();

    if (![4, 6].includes(session.role) || !session.clientId) {
      return errorResponse("Forbidden", 403);
    }

    const { contactId } = await params;

    const contact = await ClientContact.findOneAndDelete({
      _id: contactId,
      clientId: session.clientId,
    });

    if (!contact) {
      return errorResponse("Contact not found", 404);
    }

    return successResponse({ message: "Contact deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
