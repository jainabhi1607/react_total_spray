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
  const session = await auth();
  if (!session?.user) {
    throw new AuthError("Unauthorized");
  }
  // Reject sessions that haven't completed OTP verification
  if (!(session.user as any).otpVerified) {
    throw new AuthError("Unauthorized");
  }
  return session.user as unknown as AuthSession;
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

/**
 * For portal users (role 4, 6), verify the resource's clientId matches
 * the session clientId. Throws AuthError("Forbidden") if not.
 * No-op for admin users (role 1, 2, 3).
 */
export function enforcePortalScope(
  session: AuthSession,
  resourceClientId: any
): void {
  if (![4, 6].includes(session.role)) return;
  if (
    !session.clientId ||
    resourceClientId?.toString() !== session.clientId
  ) {
    throw new AuthError("Forbidden");
  }
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
