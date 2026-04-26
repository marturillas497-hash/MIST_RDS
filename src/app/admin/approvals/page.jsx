"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminSidebar } from "@/components/shared/Sidebar";
import { PageShell, PageHeader } from "@/components/shared/PageShell";

export default function ApprovalsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: p } = await supabase
        .from("profiles")
        .select("*, departments(code, name)")
        .eq("id", user.id)
        .single();
      setProfile(p);

      const { data: pendingAdvisers } = await supabase
        .from("profiles")
        .select("id, full_name, created_at, departments(code, name)")
        .eq("role", "research_adviser")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      setPending(pendingAdvisers || []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleAction(adviserId, action) {
    setActing(adviserId);
    const res = await fetch("/api/admin/approvals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adviserId, action }),
    });

    if (res.ok) {
      setPending((prev) => prev.filter((a) => a.id !== adviserId));
    }
    setActing(null);
  }

  return (
    <div className="flex">
      <AdminSidebar profile={profile || {}} />
      <PageShell>
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4">
          ← Back to dashboard
        </Link>

        <PageHeader
          title="Faculty Applications"
          subtitle="Review and approve or reject pending research adviser accounts."
        />

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="skeleton h-4 w-48 mb-2" />
                <div className="skeleton h-3 w-32" />
              </div>
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="card p-16 text-center">
            <p className="text-3xl mb-3 opacity-30">◈</p>
            <p className="text-slate-500 text-sm font-medium">No pending applications</p>
            <p className="text-slate-400 text-xs mt-1">
              All adviser applications have been reviewed.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((adviser) => (
              <div
                key={adviser.id}
                className="card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-navy-600 text-sm font-bold">
                      {adviser.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{adviser.full_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {adviser.departments && (
                        <span className="badge bg-navy-100 text-navy-700 text-[10px] uppercase">
                          {adviser.departments.code}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        Applied{" "}
                        {new Date(adviser.created_at).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:flex-shrink-0">
                  <button
                    onClick={() => handleAction(adviser.id, "reject")}
                    disabled={acting === adviser.id}
                    className="btn-ghost flex-1 sm:flex-none text-red-600 hover:bg-red-50 border border-red-200"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction(adviser.id, "approve")}
                    disabled={acting === adviser.id}
                    className="btn-secondary flex-1 sm:flex-none"
                  >
                    {acting === adviser.id ? "Processing..." : "Approve"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageShell>
    </div>
  );
}