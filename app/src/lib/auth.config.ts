import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.clientId = (user as any).clientId;
        token.lastName = (user as any).lastName;
        token.otpVerified = false;
        token.rememberMe = (user as any).rememberMe === "true";
        // Set token expiry based on remember me
        if (token.rememberMe) {
          token.maxAge = 30 * 24 * 60 * 60; // 30 days
        } else {
          token.maxAge = 24 * 60 * 60; // 1 day (session-based)
        }
      }
      // Handle session update (called from client via update())
      if (trigger === "update" && session?.otpVerified) {
        token.otpVerified = true;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as number;
        (session.user as any).clientId = token.clientId as string;
        (session.user as any).lastName = token.lastName as string;
        (session.user as any).otpVerified = token.otpVerified as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days max
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [],
  secret: process.env.NEXTAUTH_SECRET,
};
