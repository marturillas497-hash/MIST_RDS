import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminSidebar } from "@/components/shared/Sidebar";
import { PageShell, PageHeader } from "@/components/shared/PageShell";
import { StatCard } from "@/components/ui/StatCard";
import { RiskBadge } from "@/components/ui/RiskBadge";

export default async function AdminPage() {
  const profile = await requireAdmin();
  const adminClient = createAdminClient();

  const [
    { count: studentCount },
    { count: abstractCount },
    { count: pendingCount },
    { count: reportCount },
    { data: recentReports },
  ] = await Promise.all([
    adminClient.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    adminClient.from("abstracts").select("id", { count: "exact", head: true }),
    adminClient.from("profiles").select("id", { count: "exact", head: true }).eq("role", "research_adviser").eq("status", "pending"),
    adminClient.from("similarity_reports").select("id", { count: "exact", head: true }),
    adminClient
      .from("similarity_reports")
      .select("id, input_title, risk_level, similarity_score, created_at, profiles!similarity_reports_student_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const quickActions = [
    { href: "/admin/archive", icon: "⊕", label: "Add Abstract", desc: "Add a new research to the library" },
    { href: "/admin/approvals", icon: "◈", label: "Review Applications", desc: `${pendingCount || 0} pending adviser application${pendingCount !== 1 ? "s" : ""}`, highlight: pendingCount > 0 },
    { href: "/admin/analytics", icon: "◳", label: "View Analytics", desc: "Abstract views and trending research" },
    { href: "/library", icon: "◫", label: "Manage Library", desc: "Browse, edit, or delete abstracts" },
  ];

  return (
    <div className="flex">
      <AdminSidebar profile={profile} />
      <PageShell>
        <PageHeader
          title="Admin Dashboard"
          subtitle="System overview for MIST Research Discovery System."
        />

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard label="Registered Students" value={studentCount || 0} icon="◎" />
          <StatCard label="Library Abstracts" value={abstractCount || 0} icon="◫" />
          <StatCard
            label="Pending Applications"
            value={pendingCount || 0}
            icon="◈"
            sub={pendingCount > 0 ? "Needs review" : "All clear"}
          />
          <StatCard label="Total Scan Reports" value={reportCount || 0} icon="⊕" accent />
        </div>

        {/* Quick actions */}
        <div className="mb-8">
          <h2 className="font-serif text-lg text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`card-hover p-5 flex items-center gap-4 ${
                  action.highlight ? "border-amber-300 bg-amber-50" : ""
                }`}
              >
                <span className={`text-2xl ${action.highlight ? "text-amber-500" : "text-slate-400"}`}>
                  {action.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                  <p className={`text-xs mt-0.5 ${action.highlight ? "text-amber-700 font-medium" : "text-slate-500"}`}>
                    {action.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent reports */}
        <div>
          <h2 className="font-serif text-lg text-slate-800 mb-4">Recent Reports</h2>
          {!recentReports || recentReports.length === 0 ? (
            <div className="card p-8 text-center text-slate-400 text-sm">No reports submitted yet.</div>
          ) : (
            <div className="card divide-y divide-slate-100">
              {recentReports.map((report) => (
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
                      {report.profiles?.full_name} &middot;{" "}
                      {new Date(report.created_at).toLocaleDateString("en-PH", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-bold text-slate-600">
                      {Math.round(report.similarity_score * 100)}%
                    </span>
                    <RiskBadge level={report.risk_level} />
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
