import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdviser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdviserSidebar } from "@/components/shared/Sidebar";
import { PageShell, PageHeader } from "@/components/shared/PageShell";
import { RiskBadge } from "@/components/ui/RiskBadge";

export default async function StudentReportsPage({ params }) {
  const { id } = await params;
  const profile = await requireAdviser();
  const adminClient = createAdminClient();

  // Verify this student is actually assigned to this adviser
  const { data: studentMeta } = await adminClient
    .from("student_metadata")
    .select("profile_id, id_number, year_level, section, adviser_id, profiles!student_metadata_profile_id_fkey(full_name, departments(code, name))")
    .eq("profile_id", id)
    .single();

  if (!studentMeta || studentMeta.adviser_id !== profile.id) return notFound();

  const { data: reports } = await adminClient
    .from("similarity_reports")
    .select("id, input_title, similarity_score, risk_level, created_at")
    .eq("student_id", id)
    .order("created_at", { ascending: false });

  const student = {
    full_name: studentMeta.profiles.full_name,
    department: studentMeta.profiles.departments,
    id_number: studentMeta.id_number,
    year_level: studentMeta.year_level,
    section: studentMeta.section,
  };

  return (
    <div className="flex">
      <AdviserSidebar profile={profile} />
      <PageShell>
        <div className="mb-6">
          <Link href="/adviser" className="text-sm text-slate-500 hover:text-navy-600 transition-colors">
            ← Back to Students
          </Link>
        </div>

        <PageHeader
          title={student.full_name}
          subtitle="Full similarity report history for this student."
        />

        {/* Student info */}
        <div className="card p-5 mb-6 flex items-center gap-6">
          {student.department && (
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Department</p>
              <span className="badge bg-navy-100 text-navy-700 text-xs uppercase">
                {student.department.code}
              </span>
            </div>
          )}
          {student.id_number && (
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Student ID</p>
              <p className="text-sm font-mono text-slate-700">{student.id_number}</p>
            </div>
          )}
          {student.year_level && (
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Year & Section</p>
              <p className="text-sm text-slate-700">
                {student.year_level}{student.section ? ` — ${student.section}` : ""}
              </p>
            </div>
          )}
          <div className="ml-auto">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Total Reports</p>
            <p className="text-sm font-bold text-slate-700">{reports?.length || 0}</p>
          </div>
        </div>

        {/* Reports list */}
        <h2 className="font-serif text-lg text-slate-800 mb-4">Similarity Reports</h2>

        {!reports || reports.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-3xl mb-3 opacity-30">◫</p>
            <p className="text-slate-500 text-sm">This student has not submitted any reports yet.</p>
          </div>
        ) : (
          <div className="card divide-y divide-slate-100">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/dashboard/report/${report.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-medium text-slate-800 truncate group-hover:text-navy-600 transition-colors">
                    {report.input_title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(report.created_at).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs font-bold text-slate-600">
                    {Math.round(report.similarity_score * 100)}%
                  </span>
                  <RiskBadge level={report.risk_level} />
                  <span className="text-slate-300 group-hover:text-navy-400 transition-colors text-xs">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PageShell>
    </div>
  );
}