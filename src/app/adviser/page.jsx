import { requireAdviser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdviserSidebar } from "@/components/shared/Sidebar";
import { PageShell, PageHeader } from "@/components/shared/PageShell";
import { StatCard } from "@/components/ui/StatCard";
import AdviserClient from "./AdviserClient";

export default async function AdviserPage() {
  const profile = await requireAdviser();
  const adminClient = createAdminClient();

  const { data: studentMeta } = await adminClient
    .from("student_metadata")
    .select("profile_id, id_number, year_level, section, profiles!student_metadata_profile_id_fkey(full_name, departments(code, name))")
    .eq("adviser_id", profile.id);

  const students = await Promise.all(
    (studentMeta || []).map(async (sm) => {
      const { data: reports } = await adminClient
        .from("similarity_reports")
        .select("id, risk_level, similarity_score, created_at, input_title")
        .eq("student_id", sm.profile_id)
        .order("created_at", { ascending: false })
        .limit(1);

      const { count } = await adminClient
        .from("similarity_reports")
        .select("id", { count: "exact", head: true })
        .eq("student_id", sm.profile_id);

      return {
        profile_id: sm.profile_id,
        full_name: sm.profiles.full_name,
        department: sm.profiles.departments,
        id_number: sm.id_number,
        year_level: sm.year_level,
        section: sm.section,
        report_count: count || 0,
        latest_report: reports?.[0] || null,
      };
    })
  );

  return (
    <div className="flex">
      <AdviserSidebar profile={profile} />
      <PageShell>
        <PageHeader
          title={`Welcome, ${profile.full_name.split(" ")[0]}`}
          subtitle="Review your assigned students and their research similarity reports."
        />

        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCard label="Assigned Students" value={students.length} icon="◎" />
          <StatCard
            label="Total Reports Submitted"
            value={students.reduce((acc, s) => acc + s.report_count, 0)}
            icon="◫"
          />
        </div>

        <h2 className="font-serif text-lg text-slate-800 mb-4">Assigned Students</h2>

        <AdviserClient students={students} />
      </PageShell>
    </div>
  );
}