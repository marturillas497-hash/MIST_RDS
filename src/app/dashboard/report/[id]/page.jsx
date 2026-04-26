import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { StudentSidebar } from "@/components/shared/Sidebar";
import { AdviserSidebar } from "@/components/shared/Sidebar";
import { AdminSidebar } from "@/components/shared/Sidebar";
import { PageShell, PageHeader } from "@/components/shared/PageShell";
import { RiskBadge, RiskBar } from "@/components/ui/RiskBadge";
import { RISK_CONFIG } from "@/lib/constants";

export default async function ReportPage({ params }) {
  const { id } = await params;
  const profile = await getProfile();
  if (!profile) return notFound();

  const adminClient = createAdminClient();
  const { data: report } = await adminClient
    .from("similarity_reports")
    .select("*, profiles!similarity_reports_student_id_fkey(full_name, departments(name, code))")
    .eq("id", id)
    .single();

  if (!report) return notFound();

  const canView =
    profile.role === "admin" ||
    (profile.role === "student" && report.student_id === profile.id) ||
    (profile.role === "research_adviser" && report.adviser_id === profile.id);

  if (!canView) return notFound();

  let advisory = null;
  try {
    advisory = typeof report.ai_recommendations === "string"
      ? JSON.parse(report.ai_recommendations)
      : report.ai_recommendations;
  } catch {}

  const matches = report.results_json || [];
  const riskConfig = RISK_CONFIG[report.risk_level] || RISK_CONFIG.GREEN;

  const SidebarComponent =
    profile.role === "admin"
      ? AdminSidebar
      : profile.role === "research_adviser"
      ? AdviserSidebar
      : StudentSidebar;

  const backHref =
    profile.role === "admin"
      ? "/admin"
      : profile.role === "research_adviser"
      ? "/adviser"
      : "/dashboard";

  return (
    <div className="flex">
      <SidebarComponent profile={profile} />
      <PageShell>
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4">
          ← Back
        </Link>

        <PageHeader
          title="Similarity Report"
          subtitle={`Submitted ${new Date(report.created_at).toLocaleDateString("en-PH", {
            year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
          })}`}
        />

        {/* Proposal summary */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Proposed Title</p>
              <h2 className="font-serif text-xl text-slate-900">{report.input_title}</h2>
            </div>
            <RiskBadge level={report.risk_level} size="md" />
          </div>
          <div className="mb-4">
            <RiskBar score={report.similarity_score} />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Abstract / Problem Statement</p>
            <p className="text-sm text-slate-700 leading-relaxed">{report.input_description}</p>
          </div>
        </div>

        {/* Main grid — stacks on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* AI Advisory — full width on mobile, 2 cols on desktop */}
          <div className="md:col-span-2 space-y-6">
            {advisory && (
              <div className={`rounded-xl border p-6 ${riskConfig.bg} ${riskConfig.border}`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">◈</span>
                  <h3 className="font-serif text-lg text-slate-900">AI Advisory</h3>
                  <span className={`badge ${riskConfig.badge} text-xs ml-auto`}>
                    gemini-2.0-flash
                  </span>
                </div>

                {/* Verdict */}
                <div className="bg-white/70 rounded-lg p-4 mb-4">
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${riskConfig.color}`}>
                    Verdict
                  </p>
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">
                    {advisory.verdict}
                  </p>
                </div>

                {/* Critical Analysis */}
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Critical Analysis
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {advisory.critical_analysis}
                  </p>
                </div>

                {/* Proposed Titles */}
                {advisory.proposed_titles?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Proposed Unique Titles
                    </p>
                    <ul className="space-y-2">
                      {advisory.proposed_titles.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="text-navy-400 font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                          <span className="leading-relaxed">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Alternative Pathways */}
                {advisory.alternative_pathways?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Alternative Research Pathways
                    </p>
                    <div className="space-y-3">
                      {advisory.alternative_pathways.map((p, i) => (
                        <div key={i} className="bg-white/60 rounded-lg p-3">
                          <p className="text-xs font-semibold text-slate-800 mb-1">{p.title}</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Top Matches — below advisory on mobile, right col on desktop */}
          <div className="space-y-4">
            <h3 className="font-serif text-base text-slate-800">Top Matches</h3>
            {matches.length === 0 ? (
              <div className="card p-4 text-center">
                <p className="text-xs text-slate-400">No significant matches found.</p>
              </div>
            ) : (
              matches.map((m, i) => {
                const pct = Math.round(m.similarity * 100);
                let dotColor = "bg-emerald-400";
                if (pct >= 80) dotColor = "bg-red-400";
                else if (pct >= 65) dotColor = "bg-orange-400";
                else if (pct >= 45) dotColor = "bg-amber-400";

                return (
                  <div key={m.id || i} className="card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-slate-400">#{i + 1}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                        <span className="text-xs font-bold text-slate-700">{pct}%</span>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-slate-800 leading-snug line-clamp-3">
                      {m.title}
                    </p>
                    {m.authors && (
                      <p className="text-[10px] text-slate-400 mt-1.5 truncate">{m.authors}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </PageShell>
    </div>
  );
}