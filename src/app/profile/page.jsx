"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { StudentSidebar } from "@/components/shared/Sidebar";
import { PageShell, PageHeader } from "@/components/shared/PageShell";
import { YEAR_LEVELS } from "@/lib/constants";

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState(null);
  const [meta, setMeta] = useState(null);
  const [advisers, setAdvisers] = useState([]);
  const [form, setForm] = useState({ id_number: "", year_level: "", section: "", adviser_id: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

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

      const { data: m } = await supabase
        .from("student_metadata")
        .select("*, profiles!student_metadata_adviser_id_fkey(full_name)")
        .eq("profile_id", user.id)
        .single();
      setMeta(m);

      if (m) {
        setForm({
          id_number: m.id_number || "",
          year_level: m.year_level || "",
          section: m.section || "",
          adviser_id: m.adviser_id || "",
        });
      }

      const { data: advs } = await supabase
        .from("profiles")
        .select("id, full_name, departments(name)")
        .eq("role", "research_adviser")
        .eq("status", "active");
      setAdvisers(advs || []);
    }
    load();
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    const { data: { user } } = await supabase.auth.getUser();

    const { error: upsertError } = await supabase
      .from("student_metadata")
      .upsert({
        profile_id: user.id,
        id_number: form.id_number || null,
        year_level: form.year_level || null,
        section: form.section || null,
        adviser_id: form.adviser_id || null,
      });

    if (upsertError) {
      setError(upsertError.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  if (!profile) {
    return (
      <div className="flex">
        <StudentSidebar profile={{}} />
        <PageShell>
          <div className="animate-pulse space-y-4">
            <div className="skeleton h-8 w-48" />
            <div className="skeleton h-48 rounded-xl" />
          </div>
        </PageShell>
      </div>
    );
  }

  return (
    <div className="flex">
      <StudentSidebar profile={profile} />
      <PageShell>
        <PageHeader title="My Profile" subtitle="Manage your academic information." />

        <div className="max-w-xl space-y-6">
          {/* Read-only info */}
          <div className="card p-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Account Information
            </h3>
            <dl className="space-y-3">
              {[
                { label: "Full Name", value: profile.full_name },
                { label: "Department", value: profile.departments ? `${profile.departments.code} — ${profile.departments.name}` : "—" },
                { label: "Role", value: "Student" },
                { label: "Status", value: profile.status },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <dt className="text-xs text-slate-500 font-medium">{label}</dt>
                  <dd className="text-sm text-slate-800 font-medium capitalize">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Editable fields */}
          <form onSubmit={handleSave} className="card p-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Academic Profile
            </h3>

            <div className="space-y-4">
              <div>
                <label className="label">Student ID</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. 2316075"
                  value={form.id_number}
                  onChange={(e) => update("id_number", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Year Level</label>
                  <select
                    className="input"
                    value={form.year_level}
                    onChange={(e) => update("year_level", e.target.value)}
                  >
                    <option value="">Select</option>
                    {YEAR_LEVELS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Section</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. A"
                    value={form.section}
                    onChange={(e) => update("section", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label">Research Adviser</label>
                <select
                  className="input"
                  value={form.adviser_id}
                  onChange={(e) => update("adviser_id", e.target.value)}
                >
                  <option value="">No adviser selected</option>
                  {advisers.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.full_name}
                      {a.departments?.name ? ` — ${a.departments.name}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {saved && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-lg">
                Profile updated successfully.
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button type="submit" disabled={saving} className="btn-secondary">
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </PageShell>
    </div>
  );
}
