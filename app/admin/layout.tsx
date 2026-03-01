import { redirect } from "next/navigation";
import { requireAdmin } from "@/app/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  if (!user) {
    redirect("/");
  }
  return <>{children}</>;
}
