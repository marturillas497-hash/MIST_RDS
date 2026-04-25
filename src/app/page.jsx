import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";

export default async function RootPage() {
  const profile = await getProfile();

  if (!profile) redirect("/login");

  switch (profile.role) {
    case "admin":
      redirect("/admin");
    case "research_adviser":
      if (profile.status === "pending") redirect("/pending");
      redirect("/adviser");
    default:
      redirect("/dashboard");
  }
}
