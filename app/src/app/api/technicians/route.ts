import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireAuth,
  requireAdmin,
  successResponse,
  errorResponse,
  handleApiError,
  getSearchParams,
  paginatedResponse,
} from "@/lib/api-helpers";
import Technician from "@/models/Technician";
import TechnicianDetail from "@/models/TechnicianDetail";
import TechnicianTag from "@/models/TechnicianTag";
import "@/models/Tag";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    await requireAuth();
    const { page, limit, skip, search } = getSearchParams(req);

    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId");

    const query: Record<string, any> = {
      status: { $ne: 2 },
    };

    if (parentId) {
      // Fetch sub-technicians for a specific parent
      query.parentId = parentId;
    } else {
      // Only show parent-level technicians in the main listing
      query.$or = [{ parentId: { $exists: false } }, { parentId: null }];
    }

    if (search) {
      // Wrap existing $or if present
      const searchCondition = [
        { companyName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchCondition }];
        delete query.$or;
      } else {
        query.$or = searchCondition;
      }
    }

    const [technicians, total] = await Promise.all([
      Technician.find(query)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Technician.countDocuments(query),
    ]);

    // Fetch tags for each technician
    const techIds = technicians.map((t: any) => t._id);
    const allTags = await TechnicianTag.find({ technicianId: { $in: techIds } })
      .populate("tagId")
      .lean();

    // Group tags by technician
    const tagsByTech: Record<string, any[]> = {};
    for (const tt of allTags) {
      const tid = String(tt.technicianId);
      if (!tagsByTech[tid]) tagsByTech[tid] = [];
      if (tt.tagId) tagsByTech[tid].push(tt.tagId);
    }

    const enriched = technicians.map((t: any) => ({
      ...t,
      tags: tagsByTech[String(t._id)] || [],
    }));

    return paginatedResponse(enriched, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    await requireAdmin();

    const body = await req.json();
    const { companyName, licenceNumber, licenceExpiry, abn, email, phone, address, parentId } = body;

    if (!companyName) {
      return errorResponse("Company name is required");
    }

    const data: Record<string, any> = {
      companyName,
      licenceNumber,
      licenceExpiry,
      abn,
      email,
      phone,
      address,
      dateTime: new Date(),
      status: 1,
    };

    if (parentId) {
      data.parentId = parentId;
    }

    const technician = await Technician.create(data);

    // Only create TechnicianDetail for parent technicians
    if (!parentId) {
      await TechnicianDetail.create({
        technicianId: technician._id,
      });
    }

    return successResponse(technician, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
