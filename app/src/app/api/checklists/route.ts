import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  successResponse,
  errorResponse,
  handleApiError,
  getSearchParams,
  paginatedResponse,
} from "@/lib/api-helpers";
import ChecklistTemplate from "@/models/ChecklistTemplate";
import ChecklistTemplateTag from "@/models/ChecklistTemplateTag";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    await requireAuth();
    const { page, limit, skip, search } = getSearchParams(req);

    const query: Record<string, any> = {};

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const [templates, total] = await Promise.all([
      ChecklistTemplate.find(query)
        .populate("userId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ChecklistTemplate.countDocuments(query),
    ]);

    // Attach tag count to each template
    const templateIds = templates.map((t: any) => t._id);
    const tagCounts = await ChecklistTemplateTag.aggregate([
      { $match: { checklistTemplateId: { $in: templateIds } } },
      { $group: { _id: "$checklistTemplateId", count: { $sum: 1 } } },
    ]);

    const tagCountMap = new Map(
      tagCounts.map((tc: any) => [tc._id.toString(), tc.count])
    );

    const templatesWithTagCount = templates.map((t: any) => ({
      ...t,
      tagCount: tagCountMap.get(t._id.toString()) || 0,
    }));

    return paginatedResponse(templatesWithTagCount, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await requireAuth();

    const body = await req.json();
    const { title } = body;

    if (!title) {
      return errorResponse("Title is required");
    }

    const template = await ChecklistTemplate.create({
      title,
      userId: session.id,
      dateTime: new Date(),
    });

    return successResponse(template, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
