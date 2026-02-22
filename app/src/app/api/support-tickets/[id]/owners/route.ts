import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  handleApiError,
} from "@/lib/api-helpers";
import SupportTicketOwner from "@/models/SupportTicketOwner";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();

    const { id } = await params;

    const owners = await SupportTicketOwner.find({ supportTicketId: id })
      .populate("userId", "name email")
      .lean();

    return successResponse(owners);
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
    const { userId } = body;

    const owner = await SupportTicketOwner.create({
      supportTicketId: id,
      userId,
      addedBy: session.id,
      dateTime: new Date(),
    });

    return successResponse(owner, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
