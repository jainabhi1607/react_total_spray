import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import UserDetail from "@/models/UserDetail";
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await dbConnect();

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
          return null;
        }

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
