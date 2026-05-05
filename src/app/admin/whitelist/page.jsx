"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminSidebar } from "@/components/shared/Sidebar";
import { PageShell, PageHeader } from "@/components/shared/PageShell";

async function getToken() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token ?? null;
}

// ---------------------------------------------------------------------------
// Upload section
// ---------------------------------------------------------------------------
function UploadSection({ onUploadSuccess }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    setResult(null);
    if (!f) return;
    if (!f.name.endsWith(".csv")) {
      setResult({ error: "Only .csv files are accepted." });
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/whitelist", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        setResult({ error: json.error ?? "Upload failed." });
      } else {
        setResult({ success: true, message: json.message });
        setFile(null);
        onUploadSuccess?.();
      }
    } catch {
      setResult({ error: "Network error. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card p-5 md:p-6 space-y-5">
      <div>
        <h2 className="font-serif text-lg text-slate-800">Upload Student ID CSV</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Only students whose IDs appear in the whitelist will be able to register.
        </p>
      </div>

      {/* Dropzone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={[
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors select-none",
          dragging
            ? "border-[#003366] bg-blue-50"
            : file
            ? "border-emerald-400 bg-emerald-50"
            : "border-slate-200 bg-slate-50 hover:border-slate-300",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        <span className="text-3xl">{file ? "◉" : "⊕"}</span>

        {file ? (
          <div className="text-center">
            <p className="text-sm font-semibold text-emerald-700">{file.name}</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              {(file.size / 1024).toFixed(1)} KB — ready to upload
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">
              Drop your CSV here, or{" "}
              <span className="text-[#003366] underline underline-offset-2">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">Only .csv files are accepted</p>
          </div>
        )}
      </div>

      {/* Format hint */}
      <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
          Expected format
        </p>
        <pre className="text-xs text-slate-700 font-mono leading-relaxed">{`id_number\n2316075\n2316076\n2316077`}</pre>
        <p className="text-xs text-slate-400 mt-2">
          Header row is optional. One ID per line. Duplicates are ignored.
        </p>
      </div>

      {/* Result */}
      {result && (
        <div
          className={[
            "rounded-lg px-4 py-3 text-sm",
            result.error
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-emerald-50 border border-emerald-200 text-emerald-700",
          ].join(" ")}
        >
          {result.error ? `⚠ ${result.error}` : `✓ ${result.message}`}
        </div>
      )}

      {/* Button */}
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className={[
          "w-full py-2.5 rounded-xl text-sm font-semibold transition-all",
          !file || uploading
            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
            : "bg-[#003366] text-white hover:bg-[#004080] active:scale-[0.98]",
        ].join(" ")}
      >
        {uploading ? "Uploading..." : "Upload CSV"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Whitelist table
// ---------------------------------------------------------------------------
function WhitelistTable({ refreshTrigger }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const LIMIT = 50;

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const params = new URLSearchParams({
        search: debouncedSearch,
        page: String(page),
        limit: String(LIMIT),
      });

      const res = await fetch(`/api/admin/whitelist?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to load whitelist.");
      } else {
        setRows(json.data);
        setTotal(json.total);
      }
    } catch {
      setError("Network error. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, refreshTrigger]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="card p-5 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg text-slate-800">Current Whitelist</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading
              ? "Loading..."
              : `${total.toLocaleString()} student ID${total !== 1 ? "s" : ""} on record`}
          </p>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ID..."
          className="w-full sm:w-52 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366]"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-10">#</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Student ID</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Date Added</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3"><div className="h-3 w-5 bg-slate-100 rounded animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-3 w-20 bg-slate-100 rounded animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-3 w-24 bg-slate-100 rounded animate-pulse" /></td>
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-red-500">{error}</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-sm text-slate-400">
                  {debouncedSearch ? `No results for "${debouncedSearch}"` : "No student IDs uploaded yet."}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.id_number} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-400">{(page - 1) * LIMIT + i + 1}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-slate-800">{row.id_number}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(row.created_at).toLocaleDateString("en-PH", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function WhitelistPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="flex">
      <AdminSidebar />
      <PageShell>
        <PageHeader
          title="Student Whitelist"
          subtitle="Upload valid MIST student IDs. Only whitelisted IDs can register."
        />
        <div className="space-y-6">
          <UploadSection onUploadSuccess={() => setRefreshTrigger((n) => n + 1)} />
          <WhitelistTable refreshTrigger={refreshTrigger} />
        </div>
      </PageShell>
    </div>
  );
}