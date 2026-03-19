import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  if (session?.user && (session.user as any).otpVerified) {
    redirect("/dashboard");
  }
  redirect("/login");
}
