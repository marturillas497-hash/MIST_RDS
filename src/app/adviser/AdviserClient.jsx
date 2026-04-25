"use client";

import { useState } from "react";
import Link from "next/link";
import { RiskBadge } from "@/components/ui/RiskBadge";

export default function AdviserClient({ students }) {
  const [search, setSearch] = useState("");

  const filtered = students.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          className="input max-w-sm"
          placeholder="Search student by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center w-full">
          <p className="text-3xl mb-3 opacity-30">◎</p>
          <p className="text-slate-500 text-sm">
            {search ? "No students match your search." : "No students are currently assigned to you."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((student) => (
            <div key={student.profile_id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={`/adviser/students/${student.profile_id}`}
                    className="text-sm font-semibold text-slate-900 hover:text-navy-600 transition-colors"
                  >
                    {student.full_name}
                  </Link>
                  <div className="flex items-center gap-3 mt-1">
                    {student.department && (
                      <span className="badge bg-navy-100 text-navy-700 text-[10px] uppercase">
                        {student.department.code}
                      </span>
                    )}
                    {student.id_number && (
                      <span className="text-xs text-slate-400 font-mono">{student.id_number}</span>
                    )}
                    {student.year_level && (
                      <span className="text-xs text-slate-400">
                        {student.year_level}{student.section ? ` — ${student.section}` : ""}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/adviser/students/${student.profile_id}`}
                  className="text-xs text-slate-500 bg-slate-100 hover:bg-navy-50 hover:text-navy-600 transition-colors px-3 py-1 rounded-full"
                >
                  {student.report_count} report{student.report_count !== 1 ? "s" : ""}
                </Link>
              </div>

              {student.latest_report && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
                    Latest Report
                  </p>
                  <Link
                    href={`/dashboard/report/${student.latest_report.id}`}
                    className="flex items-center justify-between group"
                  >
                    <p className="text-xs text-slate-700 group-hover:text-navy-600 transition-colors line-clamp-1 flex-1 mr-3">
                      {student.latest_report.input_title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-bold text-slate-600">
                        {Math.round(student.latest_report.similarity_score * 100)}%
                      </span>
                      <RiskBadge level={student.latest_report.risk_level} />
                      <span className="text-slate-300 group-hover:text-navy-400 transition-colors text-xs">→</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}