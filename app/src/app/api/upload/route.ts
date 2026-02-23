import { NextRequest } from "next/server";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { requireAdmin, successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "resources";

    if (!file) {
      return errorResponse("No file provided");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename with timestamp
    const ext = path.extname(file.name);
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueName = `${baseName}_${Date.now()}${ext}`;

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(uploadDir, { recursive: true });

    // Write file
    const filePath = path.join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    const url = `/uploads/${folder}/${uniqueName}`;

    return successResponse({
      url,
      fileName: uniqueName,
      originalName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
