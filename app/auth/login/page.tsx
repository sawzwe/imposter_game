import { redirect } from "next/navigation";
import { getUser } from "@/app/lib/auth";
import AuthLoginClient from "./AuthLoginClient";

export default async function LoginPage() {
  const user = await getUser();
  if (user) {
    redirect("/");
  }
  return <AuthLoginClient />;
}
