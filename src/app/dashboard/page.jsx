import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StudentSidebar } from "@/components/shared/Sidebar";
import { PageShell } from "@/components/shared/PageShell";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatCard } from "@/components/ui/StatCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireStudent();
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("similarity_reports")
    .select("id, input_title, similarity_score, risk_level, created_at, status")
    .eq("student_id", profile.id)
    .order("created_at", { ascending: false });

  const phtOffset = 8 * 60 * 60 * 1000;
  const nowPHT = new Date(Date.now() + phtOffset);
  const dayStartPHT = new Date(nowPHT);
  dayStartPHT.setUTCHours(0, 0, 0, 0);
  const dayStartUTC = new Date(dayStartPHT.getTime() - phtOffset);

  const { count: todayCount } = await supabase
    .from("similarity_reports")
    .select("id", { count: "exact", head: true })
    .eq("student_id", profile.id)
    .gte("created_at", dayStartUTC.toISOString());

  const scansRemaining = Math.max(0, 3 - (todayCount || 0));

  const { data: meta } = await supabase
    .from("student_metadata")
    .select("adviser_id, id_number, year_level, section, profiles!student_metadata_adviser_id_fkey(full_name)")
    .eq("profile_id", profile.id)
    .single();

  const adviserName = meta?.profiles?.full_name || null;

  return (
    <div className="flex">
      <StudentSidebar profile={profile} />
      <PageShell>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="page-title">
              Hello, {profile.full_name.split(" ")[0]}
            </h1>
            <p className="page-subtitle">Here is your research activity overview.</p>
          </div>
          {scansRemaining > 0 ? (
            <Link href="/submit" className="btn-primary text-sm">
              + New Scan
            </Link>
          ) : (
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-lg">
              Scan limit reached
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <StatCard label="Total Reports" value={reports?.length || 0} icon="◫" />
          <StatCard
            label="Scans Remaining Today"
            value={scansRemaining}
            icon="⊕"
            sub="Resets at 12:00 AM PHT"
          />
          <StatCard
            label="Assigned Adviser"
            value={adviserName ? adviserName.split(" ").slice(-1)[0] : "None"}
            icon="◎"
            sub={adviserName || "Not yet assigned"}
          />
        </div>

        {/* Recent reports */}
        <div>
          <h2 className="font-serif text-lg text-slate-800 mb-4">
            Recent Similarity Reports
          </h2>

          {!reports || reports.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-3xl mb-3 opacity-30">◫</p>
              <p className="text-slate-500 text-sm mb-4">
                You have not run any similarity scans yet.
              </p>
              <Link href="/submit" className="btn-secondary">
                Run your first scan
              </Link>
            </div>
          ) : (
            <div className="card divide-y divide-slate-100">
              {reports.map((report) => (
                <Link
                  key={report.id}
                  href={`/dashboard/report/${report.id}`}
                  className="flex items-center justify-between px-4 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm font-medium text-slate-800 truncate group-hover:text-navy-600 transition-colors">
                      {report.input_title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(report.created_at).toLocaleDateString("en-PH", {
                        year: "numeric", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-slate-600">
                      {Math.round(report.similarity_score * 100)}%
                    </span>
                    <RiskBadge level={report.risk_level} />
                    <span className="text-slate-300 group-hover:text-navy-400 transition-colors text-xs">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </PageShell>
    </div>
  );
}