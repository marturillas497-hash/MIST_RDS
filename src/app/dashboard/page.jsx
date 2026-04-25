import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StudentSidebar } from "@/components/shared/Sidebar";
import { PageShell, PageHeader } from "@/components/shared/PageShell";
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
    <div style={{ display: "flex" }}>
      <StudentSidebar profile={profile} />
      <div style={{ marginLeft: "16rem", minHeight: "100vh", flex: 1 }}>
        <main style={{ maxWidth: "64rem", margin: "0 auto", padding: "2.5rem 2rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem" }}>
            <div>
              <h1 style={{ fontFamily: "DM Serif Display, Georgia, serif", fontSize: "1.5rem", color: "#0f172a", letterSpacing: "-0.02em" }}>
                Hello, {profile.full_name.split(" ")[0]}
              </h1>
              <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
                Here is your research activity overview.
              </p>
            </div>
            {scansRemaining > 0 ? (
              <Link href="/submit" className="btn-primary">
                + New Scan
              </Link>
            ) : (
              <span style={{
                fontSize: "0.75rem", color: "#64748b",
                backgroundColor: "#f1f5f9", padding: "0.625rem 1rem", borderRadius: "0.5rem",
              }}>
                Scan limit reached for today
              </span>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
            <StatCard label="Total Reports" value={reports?.length || 0} icon="◫" />
            <StatCard label="Scans Remaining Today" value={scansRemaining} icon="⊕" sub="Resets at 12:00 AM PHT" />
            <StatCard
              label="Assigned Adviser"
              value={adviserName ? adviserName.split(" ").slice(-1)[0] : "None"}
              icon="◎"
              sub={adviserName || "Not yet assigned"}
            />
          </div>

          {/* Recent reports */}
          <div>
            <h2 style={{ fontFamily: "DM Serif Display, Georgia, serif", fontSize: "1.125rem", color: "#1e293b", marginBottom: "1rem" }}>
              Recent Similarity Reports
            </h2>

            {!reports || reports.length === 0 ? (
              <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
                <p style={{ fontSize: "1.875rem", marginBottom: "0.75rem", opacity: 0.3 }}>◫</p>
                <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1rem" }}>
                  You have not run any similarity scans yet.
                </p>
                <Link href="/submit" className="btn-secondary">
                  Run your first scan
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {reports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/dashboard/report/${report.id}`}
                    className="card-hover"
                    style={{ padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: "1rem" }}>
                      <p style={{ fontSize: "0.875rem", fontWeight: "500", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {report.input_title}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                        {new Date(report.created_at).toLocaleDateString("en-PH", {
                          year: "numeric", month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "#334155" }}>
                        {Math.round(report.similarity_score * 100)}%
                      </span>
                      <RiskBadge level={report.risk_level} />
                      <span style={{ color: "#cbd5e1" }}>→</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}