import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminSidebar } from "@/components/shared/Sidebar";
import { PageShell, PageHeader } from "@/components/shared/PageShell";

export default async function AnalyticsPage() {
  const profile = await requireAdmin();
  const adminClient = createAdminClient();

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalViews },
    { count: weekViews },
    { data: recentHistory },
  ] = await Promise.all([
    adminClient.from("abstract_views").select("id", { count: "exact", head: true }),
    adminClient
      .from("abstract_views")
      .select("id", { count: "exact", head: true })
      .gte("viewed_at", oneWeekAgo),
    adminClient
      .from("abstract_views")
      .select("viewed_at, profiles(full_name, student_metadata(id_number)), abstracts(title)")
      .order("viewed_at", { ascending: false })
      .limit(50),
  ]);

  const { data: allViews } = await adminClient
    .from("abstract_views")
    .select("abstract_id, abstracts(title, accession_id, departments(code))");

  const viewCounts = {};
  (allViews || []).forEach((v) => {
    const key = v.abstract_id;
    if (!viewCounts[key]) {
      viewCounts[key] = {
        abstract_id: key,
        title: v.abstracts?.title || "Unknown",
        accession_id: v.abstracts?.accession_id,
        dept_code: v.abstracts?.departments?.code,
        count: 0,
      };
    }
    viewCounts[key].count++;
  });

  const topAllTime = Object.values(viewCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const { data: weekViewed } = await adminClient
    .from("abstract_views")
    .select("abstract_id, abstracts(title, accession_id, departments(code))")
    .gte("viewed_at", oneWeekAgo);

  const weekCounts = {};
  (weekViewed || []).forEach((v) => {
    const key = v.abstract_id;
    if (!weekCounts[key]) {
      weekCounts[key] = {
        abstract_id: key,
        title: v.abstracts?.title || "Unknown",
        accession_id: v.abstracts?.accession_id,
        dept_code: v.abstracts?.departments?.code,
        count: 0,
      };
    }
    weekCounts[key].count++;
  });

  const topWeek = Object.values(weekCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="flex">
      <AdminSidebar profile={profile} />
      <PageShell>
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4">
          ← Back to dashboard
        </Link>

        <PageHeader
          title="Library Analytics"
          subtitle="Abstract view counts, trending research, and student activity."
        />

        {/* Stats — compact horizontal cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="card p-4 flex items-center gap-4">
            <span className="text-2xl opacity-50">◳</span>
            <div>
              <p className="text-2xl font-bold font-serif text-slate-900 leading-none">
                {totalViews || 0}
              </p>
              <p className="text-sm text-slate-500 mt-1">Total Abstract Views</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-4">
            <span className="text-2xl opacity-50">◫</span>
            <div>
              <p className="text-2xl font-bold font-serif text-slate-900 leading-none">
                {weekViews || 0}
              </p>
              <p className="text-sm text-slate-500 mt-1">Views This Week</p>
              <p className="text-xs text-slate-400">Last 7 days</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <h2 className="font-serif text-lg text-slate-800 mb-4">
              Top 10 Most Viewed (All Time)
            </h2>
            {topAllTime.length === 0 ? (
              <div className="card p-8 text-center text-slate-400 text-sm">
                No views recorded yet.
              </div>
            ) : (
              <div className="card divide-y divide-slate-100">
                {topAllTime.map((item, i) => (
                  <div key={item.abstract_id} className="flex items-center gap-4 px-4 md:px-5 py-3">
                    <span className="text-xs font-bold text-slate-300 w-5 text-right flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 font-medium truncate">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.dept_code && (
                          <span className="badge bg-navy-100 text-navy-700 text-[10px] uppercase">
                            {item.dept_code}
                          </span>
                        )}
                        {item.accession_id && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.accession_id}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div
                        className="h-1.5 bg-navy-200 rounded-full hidden sm:block"
                        style={{
                          width: `${Math.max(24, (item.count / (topAllTime[0]?.count || 1)) * 80)}px`,
                        }}
                      />
                      <span className="text-xs font-bold text-navy-600 w-8 text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-serif text-lg text-slate-800 mb-4">Trending This Week</h2>
            {topWeek.length === 0 ? (
              <div className="card p-8 text-center text-slate-400 text-sm">
                No views this week.
              </div>
            ) : (
              <div className="card divide-y divide-slate-100">
                {topWeek.map((item, i) => (
                  <div key={item.abstract_id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-400 font-bold">#{i + 1}</span>
                      <span className="text-xs font-bold text-yellow-600">
                        {item.count} view{item.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium line-clamp-2 leading-snug">
                      {item.title}
                    </p>
                    {item.dept_code && (
                      <span className="badge bg-navy-100 text-navy-700 text-[10px] uppercase mt-1.5">
                        {item.dept_code}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View history */}
        <div>
          <h2 className="font-serif text-lg text-slate-800 mb-4">
            Recent View History
            <span className="text-sm font-sans font-normal text-slate-400 ml-2">
              (last 50 entries)
            </span>
          </h2>
          {!recentHistory || recentHistory.length === 0 ? (
            <div className="card p-8 text-center text-slate-400 text-sm">
              No view history yet.
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Timestamp</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Student</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Student ID</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Abstract Viewed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentHistory.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(v.viewed_at).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-800 font-medium whitespace-nowrap">
                        {v.profiles?.full_name || "—"}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400 font-mono whitespace-nowrap">
                        {v.profiles?.student_metadata?.[0]?.id_number ||
                          v.profiles?.student_metadata?.id_number ||
                          "—"}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-700 max-w-xs truncate">
                        {v.abstracts?.title || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageShell>
    </div>
  );
}