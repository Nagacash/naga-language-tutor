import { redirect } from "next/navigation";
import TutorApp from "@/components/tutor-app";
import { accessFor } from "@/lib/access";

export const dynamic = "force-dynamic";

// The practice app is for admins and subscribers. Everyone else is sent to sign-in or to plans.
export default async function AppPage() {
  const access = await accessFor();
  if (!access.ok) redirect(access.reason === "signed-out" ? "/auth/sign-in" : "/account");
  return <TutorApp />;
}
