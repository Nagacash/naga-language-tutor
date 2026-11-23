import { redirect } from "next/navigation";
import TutorApp from "@/components/tutor-app";
import { sessionUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// The practice app is for signed-in users. Everyone else starts on the landing page.
export default async function AppPage() {
  if (!(await sessionUserId())) redirect("/auth/sign-in");
  return <TutorApp />;
}
