import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import UserDetail from "@/models/UserDetail";
import UserLoginCode from "@/models/UserLoginCode";
import UserLoginIpAddress from "@/models/UserLoginIpAddress";
import { sendOtpEmail } from "@/lib/email";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await dbConnect();

        // Get IP from headers
        const forwarded = request?.headers?.get?.("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0].trim() : "";

        const user = await User.findOne({
          email: credentials.email,
          status: { $in: [1, 25] },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          // Log failed attempt
          await UserLoginIpAddress.create({
            userId: user._id,
            ipAddress: ip,
            dateTime: new Date(),
            loginResponse: "Failed",
          }).catch(() => {});
          return null;
        }

        // Log successful login
        await UserLoginIpAddress.create({
          userId: user._id,
          ipAddress: ip,
          dateTime: new Date(),
          loginResponse: "Success",
        }).catch(() => {});

        // Generate and send OTP (cryptographically secure)
        const otpArray = new Uint32Array(1);
        crypto.getRandomValues(otpArray);
        const otp = 100000 + (otpArray[0] % 900000);
        const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
        await UserLoginCode.create({
          userId: user._id,
          otp,
          expiryTime,
          status: 1,
        });

        // Send OTP email (don't block login if email fails)
        sendOtpEmail(user.email, otp, user.name).catch((err) =>
          console.error("Failed to send OTP email:", err)
        );

        const userDetail = await UserDetail.findOne({ userId: user._id });

        return {
          id: user._id.toString(),
          name: user.name,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          clientId: user.clientId?.toString() || "",
          image: userDetail?.profilePic || "",
          rememberMe: credentials.rememberMe === "true" ? "true" : "false",
        };
      },
    }),
  ],
});
