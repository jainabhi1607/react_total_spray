import type { NextAuthConfig } from "next-auth";
import { encryptToken, decryptToken } from "./token-encryption";

export const authConfig: NextAuthConfig = {
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Encrypt sensitive user data into a single encrypted payload
        const encryptedData = encryptToken({
          id: user.id,
          role: (user as any).role,
          clientId: (user as any).clientId,
          lastName: (user as any).lastName,
          otpVerified: false,
          rememberMe: (user as any).rememberMe === "true",
        });
        token.encryptedPayload = encryptedData;
        // Clear old plain-text fields
        delete token.id;
        delete token.role;
        delete token.clientId;
        delete token.lastName;
        delete token.otpVerified;
        delete token.rememberMe;
        // Set token expiry based on remember me
        const rememberMe = (user as any).rememberMe === "true";
        if (rememberMe) {
          token.maxAge = 30 * 24 * 60 * 60; // 30 days
        } else {
          token.maxAge = 24 * 60 * 60; // 1 day
        }
      }

      // Migrate old unencrypted tokens to encrypted format
      if (!token.encryptedPayload && token.id) {
        token.encryptedPayload = encryptToken({
          id: token.id,
          role: token.role,
          clientId: token.clientId,
          lastName: token.lastName,
          otpVerified: token.otpVerified ?? false,
          rememberMe: token.rememberMe ?? false,
        });
        delete token.id;
        delete token.role;
        delete token.clientId;
        delete token.lastName;
        delete token.otpVerified;
        delete token.rememberMe;
      }

      // Handle session update (called from client via update())
      if (trigger === "update" && session?.otpVerified && token.encryptedPayload) {
        const decrypted = decryptToken(token.encryptedPayload as string);
        decrypted.otpVerified = true;
        token.encryptedPayload = encryptToken(decrypted);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.encryptedPayload) {
        const decrypted = decryptToken(token.encryptedPayload as string);
        (session.user as any).id = decrypted.id as string;
        (session.user as any).role = decrypted.role as number;
        (session.user as any).clientId = decrypted.clientId as string;
        (session.user as any).lastName = decrypted.lastName as string;
        (session.user as any).otpVerified = decrypted.otpVerified as boolean;
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
