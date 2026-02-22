import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";

export interface AuthSession {
  id: string;
  name: string;
  lastName?: string;
  email: string;
  role: number;
  clientId?: string;
}

export async function getSession(): Promise<AuthSession | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as unknown as AuthSession;
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Unauthorized");
  }
  return session;
}

export async function requireAdmin(): Promise<AuthSession> {
  const session = await requireAuth();
  if (![1, 2, 3].includes(session.role)) {
    throw new AuthError("Forbidden");
  }
  return session;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export function successResponse(data: any, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    const status = error.message === "Forbidden" ? 403 : 401;
    return errorResponse(error.message, status);
  }
  console.error("API Error:", error);
  return errorResponse("Internal server error", 500);
}

export function getSearchParams(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const sort = searchParams.get("sort") || "createdAt";
  const order = searchParams.get("order") === "asc" ? 1 : -1;
  const search = searchParams.get("q") || "";
  const status = searchParams.get("status");

  return {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit)),
    sort,
    order,
    search,
    status: status ? parseInt(status) : undefined,
    skip: (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit)),
  };
}

export function paginatedResponse(data: any[], total: number, page: number, limit: number) {
  return successResponse({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
