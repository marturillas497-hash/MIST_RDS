import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StudentSidebar, AdviserSidebar, AdminSidebar } from "@/components/shared/Sidebar";
import { PageShell, PageHeader } from "@/components/shared/PageShell";
import { LibraryClient } from "@/components/shared/LibraryClient";
import Link from "next/link";

export default async function LibraryPage() {
  const profile = await getProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { data: departments } = await supabase
    .from("departments")
    .select("*")
    .order("code");

  const isAdmin = profile.role === "admin";

  const SidebarComponent =
    profile.role === "admin"
      ? AdminSidebar
      : profile.role === "research_adviser"
      ? AdviserSidebar
      : StudentSidebar;

  return (
    <div className="flex">
      <SidebarComponent profile={profile} />
      <PageShell>
        <PageHeader
          title="Research Library"
          subtitle="Browse the institutional archive of MIST research abstracts."
          action={
            isAdmin && (
              <Link href="/admin/archive" className="btn-primary">
                + Add Abstract
              </Link>
            )
          }
        />
        <LibraryClient
          isAdmin={isAdmin}
          profile={profile}
          departments={departments || []}
        />
      </PageShell>
    </div>
  );
}
