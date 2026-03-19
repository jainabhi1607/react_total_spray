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
];

export const proxy = auth((req) => {
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

  // If OTP is not verified, the session is incomplete — clear it and send to login
  const otpVerified = (req.auth.user as any)?.otpVerified;
  if (!otpVerified) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("next-auth.session-token");
    response.cookies.delete("__Secure-next-auth.session-token");
    return response;
  }

  const role = (req.auth.user as any)?.role;

  // Protected routes — check role-based access
  const protectedPaths = [
    "/dashboard", "/clients", "/job-cards", "/support-tickets",
    "/technicians", "/checklists", "/resources", "/settings",
    "/users", "/assets", "/contacts", "/archive",
    "/sites", "/company", "/portal-users", "/user-groups", "/portal-settings",
  ];

  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    // Client portal users (4, 6) can access limited routes
    if (role === 4 || role === 6) {
      const clientAllowedPaths = [
        "/dashboard", "/job-cards", "/support-tickets",
        "/assets", "/contacts", "/sites",
        "/company", "/portal-users", "/user-groups", "/portal-settings",
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
