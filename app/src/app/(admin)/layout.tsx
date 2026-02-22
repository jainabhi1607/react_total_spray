import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminLayout } from "@/components/layout/admin-layout";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    id: (session.user as any).id || "",
    name: session.user.name || "",
    lastName: (session.user as any).lastName || "",
    email: session.user.email || "",
    role: (session.user as any).role || 3,
    clientId: (session.user as any).clientId || "",
    image: session.user.image || "",
  };

  return <AdminLayout user={user}>{children}</AdminLayout>;
}
