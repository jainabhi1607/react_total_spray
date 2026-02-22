import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const publicPaths = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/otp",
  "/invite",
  "/job-card",
  "/client-asset",
  "/support",
  "/log-maintenance",
  "/history",
  "/api/auth",
  "/api/public",
  "/api/seed",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (req.auth.user as any)?.role;

  // Admin routes - require role 1, 2, or 3
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/clients") ||
      pathname.startsWith("/job-cards") || pathname.startsWith("/support-tickets") ||
      pathname.startsWith("/technicians") || pathname.startsWith("/checklists") ||
      pathname.startsWith("/resources") || pathname.startsWith("/settings") ||
      pathname.startsWith("/users") || pathname.startsWith("/assets") ||
      pathname.startsWith("/contacts") || pathname.startsWith("/archive")) {

    // Client portal users (4, 6) can access limited admin routes
    if (role === 4 || role === 6) {
      const clientAllowedPaths = [
        "/dashboard", "/clients", "/job-cards", "/support-tickets",
        "/assets", "/contacts", "/resources", "/settings",
      ];
      if (!clientAllowedPaths.some((path) => pathname.startsWith(path))) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
