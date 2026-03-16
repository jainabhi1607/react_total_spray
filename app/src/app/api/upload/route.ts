import { NextRequest } from "next/server";
import path from "path";
import { writeFile, mkdir, access } from "fs/promises";
import { requireAuth, successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function getUniqueFilename(uploadDir: string, baseName: string, ext: string): Promise<string> {
  const timestamp = Date.now();
  let candidate = `${baseName}_${timestamp}${ext}`;

  if (!(await fileExists(path.join(uploadDir, candidate)))) {
    return candidate;
  }

  // If file exists, append incrementing suffix
  let counter = 2;
  while (true) {
    candidate = `${baseName}_${timestamp}-${counter}${ext}`;
    if (!(await fileExists(path.join(uploadDir, candidate)))) {
      return candidate;
    }
    counter++;
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "resources";

    if (!file) {
      return errorResponse("No file provided");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name);
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename, appending -2, -3 etc. if file already exists
    const uniqueName = await getUniqueFilename(uploadDir, baseName, ext);

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
