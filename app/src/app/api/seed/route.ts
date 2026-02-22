import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import UserDetail from "@/models/UserDetail";

export async function GET() {
  try {
    await dbConnect();

    const email = "jainabhi1607@gmail.com";
    const existing = await User.findOne({ email });

    if (existing) {
      const hashedPassword = await bcrypt.hash("1234567890", 10);
      existing.password = hashedPassword;
      existing.role = 1;
      existing.status = 1;
      existing.name = "Abhishek";
      existing.lastName = "Jain";
      await existing.save();
      return NextResponse.json({ success: true, message: "Admin user updated", userId: existing._id });
    }

    const hashedPassword = await bcrypt.hash("1234567890", 10);
    const user = await User.create({
      name: "Abhishek",
      lastName: "Jain",
      email,
      password: hashedPassword,
      role: 1,
      status: 1,
      phone: "",
      position: "Super Admin",
    });

    await UserDetail.create({
      userId: user._id,
      profilePic: "",
      twoFactorAuth: 0,
    });

    return NextResponse.json({ success: true, message: "Admin user created", userId: user._id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
