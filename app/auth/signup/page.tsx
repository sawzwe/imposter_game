import { redirect } from "next/navigation";
import { getUser } from "@/app/lib/auth";
import AuthSignupClient from "./AuthSignupClient";

export default async function SignupPage() {
  const user = await getUser();
  if (user) {
    redirect("/");
  }
  return <AuthSignupClient />;
}
