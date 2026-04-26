"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AdminSidebar } from "@/components/shared/Sidebar";
import { PageShell, PageHeader } from "@/components/shared/PageShell";
import { generateEmbedding } from "@/lib/embeddings";

export default function ArchivePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [prevAccession, setPrevAccession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    abstract_text: "",
    authors: "",
    year: new Date().getFullYear().toString(),
    department_id: "",
    accession_id: "",
  });

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

      const { data: depts } = await supabase
        .from("departments")
        .select("*")
        .order("code");
      setDepartments(depts || []);
    }
    load();
  }, []);

  async function loadPrevAccession(deptId) {
    if (!deptId) { setPrevAccession(null); return; }

    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return;

    const { data } = await supabase
      .from("abstracts")
      .select("accession_id")
      .eq("department_id", deptId)
      .order("accession_id", { ascending: false })
      .limit(1);

    setPrevAccession(data?.[0]?.accession_id || `${dept.code}-000 (no entries yet)`);
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "department_id") loadPrevAccession(value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title.trim()) { setError("Research title is required."); return; }
    if (!form.abstract_text.trim()) { setError("Abstract text is required."); return; }
    if (!form.department_id) { setError("Department is required."); return; }
    if (!form.accession_id.trim()) { setError("Accession ID is required."); return; }
    if (!form.authors.trim()) { setError("Authors field is required."); return; }

    setLoading(true);

    try {
      const combinedText = `${form.title.trim()} ${form.abstract_text.trim()}`;
      const embedding = await generateEmbedding(combinedText);

      const res = await fetch("/api/admin/abstracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          abstract_text: form.abstract_text.trim(),
          authors: form.authors.trim(),
          year: form.year ? parseInt(form.year) : null,
          department_id: form.department_id,
          accession_id: form.accession_id.trim(),
          embedding,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add abstract.");
      } else {
        setSuccess(`"${form.title}" has been added to the library.`);
        setForm({
          title: "",
          abstract_text: "",
          authors: "",
          year: new Date().getFullYear().toString(),
          department_id: form.department_id,
          accession_id: "",
        });
        loadPrevAccession(form.department_id);
      }
    } catch (err) {
      console.error("Archive error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex">
      <AdminSidebar profile={profile || {}} />
      <PageShell>
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4">
          ← Back to dashboard
        </Link>

        <PageHeader
          title="Add to Archive"
          subtitle="Add a new research abstract to the institutional library."
        />

        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card p-6 space-y-5">
              <div>
                <label className="label">
                  Research Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Full research title as published"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input"
                    value={form.department_id}
                    onChange={(e) => update("department_id", e.target.value)}
                    disabled={loading}
                    required
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} — {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">
                    Accession ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. BSIS-001"
                    value={form.accession_id}
                    onChange={(e) => update("accession_id", e.target.value)}
                    disabled={loading}
                    required
                  />
                  {prevAccession && (
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      Last accession in this dept: <span className="font-mono font-semibold">{prevAccession}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Authors <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="dela Cruz, J., Santos, M."
                    value={form.authors}
                    onChange={(e) => update("authors", e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="label">Year Published</label>
                  <input
                    type="number"
                    className="input"
                    placeholder={new Date().getFullYear()}
                    min="1990"
                    max={new Date().getFullYear()}
                    value={form.year}
                    onChange={(e) => update("year", e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  Abstract Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="input resize-none"
                  rows={8}
                  placeholder="Full abstract text as written in the research paper..."
                  value={form.abstract_text}
                  onChange={(e) => update("abstract_text", e.target.value)}
                  disabled={loading}
                  required
                />
                <p className="text-xs text-slate-400 mt-1">
                  {form.abstract_text.length} characters
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-lg">
                ✓ {success}
              </div>
            )}

            {loading && (
              <div className="card p-4 flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-navy-200 border-t-navy-500 animate-spin flex-shrink-0" />
                <p className="text-sm text-slate-600">
                  Generating semantic embedding and saving to library...
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-slate-400">
                A 384-dimension embedding will be generated in your browser before saving.
              </p>
              <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
                {loading ? "Adding..." : "Add to Archive"}
              </button>
            </div>
          </form>
        </div>
      </PageShell>
    </div>
  );
}