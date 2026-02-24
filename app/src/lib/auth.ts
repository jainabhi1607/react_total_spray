import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import UserDetail from "@/models/UserDetail";
import UserLoginIpAddress from "@/models/UserLoginIpAddress";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
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

        const userDetail = await UserDetail.findOne({ userId: user._id });

        return {
          id: user._id.toString(),
          name: user.name,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          clientId: user.clientId?.toString() || "",
          image: userDetail?.profilePic || "",
        };
      },
    }),
  ],
});
