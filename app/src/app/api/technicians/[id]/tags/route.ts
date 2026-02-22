import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import TechnicianTag from "@/models/TechnicianTag";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id } = await params;

    const tags = await TechnicianTag.find({ technicianId: id })
      .populate("tagId")
      .lean();

    return successResponse(tags);
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
    await requireAuth();
    const { id } = await params;

    const body = await req.json();
    const { tagId } = body;

    if (!tagId) {
      return errorResponse("Tag ID is required");
    }

    // Check if tag is already assigned
    const existing = await TechnicianTag.findOne({ technicianId: id, tagId });
    if (existing) {
      return errorResponse("Tag is already assigned to this technician");
    }

    const technicianTag = await TechnicianTag.create({
      technicianId: id,
      tagId,
      dateTime: new Date(),
    });

    return successResponse(technicianTag, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    await requireAuth();
    const { id } = await params;

    const body = await req.json();
    const { tagIds } = body;

    if (!Array.isArray(tagIds)) {
      return errorResponse("tagIds must be an array");
    }

    // Remove all existing tags for this technician
    await TechnicianTag.deleteMany({ technicianId: id });

    // Re-create only the provided tags
    if (tagIds.length > 0) {
      const tagDocs = tagIds.map((tagId: string) => ({
        technicianId: id,
        tagId,
        dateTime: new Date(),
      }));
      await TechnicianTag.insertMany(tagDocs);
    }

    const updatedTags = await TechnicianTag.find({ technicianId: id })
      .populate("tagId")
      .lean();

    return successResponse(updatedTags);
  } catch (error) {
    return handleApiError(error);
  }
}
