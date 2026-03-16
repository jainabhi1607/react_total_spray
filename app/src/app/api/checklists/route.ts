import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAdmin,
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
    await requireAdmin();
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

    // Attach tag count and tag IDs to each template
    const templateIds = templates.map((t: any) => t._id);
    const templateTags = await ChecklistTemplateTag.find({
      checklistTemplateId: { $in: templateIds },
    }).lean();

    const tagCountMap = new Map<string, number>();
    const tagIdsMap = new Map<string, string[]>();
    for (const tt of templateTags as any[]) {
      const tid = tt.checklistTemplateId.toString();
      tagCountMap.set(tid, (tagCountMap.get(tid) || 0) + 1);
      const ids = tagIdsMap.get(tid) || [];
      ids.push(tt.checklistTagId.toString());
      tagIdsMap.set(tid, ids);
    }

    const templatesWithTagCount = templates.map((t: any) => ({
      ...t,
      tagCount: tagCountMap.get(t._id.toString()) || 0,
      tagIds: tagIdsMap.get(t._id.toString()) || [],
    }));

    return paginatedResponse(templatesWithTagCount, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await requireAdmin();

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
