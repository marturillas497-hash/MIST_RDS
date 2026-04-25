"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { YEAR_LEVELS } from "@/lib/constants";

function toTitleCase(str) {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

function toUpperCase(str) {
  return str.toUpperCase();
}

export default function RegisterPage() {
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [advisers, setAdvisers] = useState([]);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    department_id: "",
    id_number: "",
    year_level: "",
    section: "",
    adviser_id: "",
  });

  useEffect(() => {
    async function loadData() {
      const { data: depts } = await supabase.from("departments").select("*").order("code");
      setDepartments(depts || []);

      const { data: advs } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "research_adviser")
        .eq("status", "active");
      setAdvisers(advs || []);
    }
    loadData();
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validateStep1() {
    if (!form.full_name.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.password) return "Password is required.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    return null;
  }

  function validateStep2() {
    if (!form.department_id) return "Please select a department.";
    if (form.role === "student") {
      if (!form.id_number.trim()) return "Student ID is required.";
      if (!form.year_level) return "Year level is required.";
      if (!form.section.trim()) return "Section is required.";
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    console.log("handleSubmit fired, step:", step);

    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
      setStep(2);
      return;
    }

    const err = validateStep2();
    if (err) { setError(err); return; }

    setLoading(true);

    let res;
    try {
      res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          role: form.role,
          department_id: form.department_id,
          id_number: form.id_number || undefined,
          year_level: form.year_level || undefined,
          section: form.section || undefined,
          adviser_id: form.adviser_id || undefined,
        }),
      });
    } catch (fetchErr) {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
      return;
    }

    let data;
    try {
      data = await res.json();
    } catch {
      if (res.status === 201) {
        window.location.href = form.role === "research_adviser"
          ? "/login?registered=adviser"
          : "/login?registered=student";
        return;
      }
      setError("Server error. Please try again.");
      setLoading(false);
      return;
    }

    if (!res.ok) {
      setError(data.error || "Registration failed.");
      setLoading(false);
      return;
    }

    window.location.href = form.role === "research_adviser"
      ? "/login?registered=adviser"
      : "/login?registered=student";
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#003366" }}
          >
            <span style={{ color: "#ffcc00", fontFamily: "serif", fontSize: "1rem", fontWeight: "bold" }}>
              M
            </span>
          </div>
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: "700", color: "#002a52", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              MIST-RDS
            </p>
            <p style={{ fontSize: "0.625rem", color: "#94a3b8" }}>Research Discovery System</p>
          </div>
        </div>

        <div className="card p-8">
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  style={{
                    width: "1.5rem",
                    height: "1.5rem",
                    borderRadius: "9999px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    backgroundColor: s <= step ? "#003366" : "#f1f5f9",
                    color: s <= step ? "#ffffff" : "#94a3b8",
                    transition: "all 0.2s",
                  }}
                >
                  {s}
                </div>
                {s < 2 && (
                  <div
                    style={{
                      width: "2rem",
                      height: "2px",
                      backgroundColor: s < step ? "#003366" : "#e2e8f0",
                    }}
                  />
                )}
              </div>
            ))}
            <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "#64748b" }}>
              {step === 1 ? "Account details" : "Academic profile"}
            </span>
          </div>

          <h2 className="font-serif" style={{ fontSize: "1.5rem", color: "#0f172a", marginBottom: "0.25rem" }}>
            {step === 1 ? "Create your account" : "Your academic profile"}
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.5rem" }}>
            {step === 1
              ? "Join MIST-RDS to validate your research proposals."
              : "Tell us about your academic background."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <label className="label">Full name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Juan Dela Cruz"
                    value={form.full_name}
                    onChange={(e) => update("full_name", toTitleCase(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="you@mist.edu.ph"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">I am registering as</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    {[
                      { value: "student", label: "Student" },
                      { value: "research_adviser", label: "Research Adviser" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update("role", opt.value)}
                        style={{
                          padding: "0.625rem 1rem",
                          borderRadius: "0.5rem",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          border: `1px solid ${form.role === opt.value ? "#003366" : "#e2e8f0"}`,
                          backgroundColor: form.role === opt.value ? "#003366" : "#ffffff",
                          color: form.role === opt.value ? "#ffffff" : "#475569",
                          transition: "all 0.2s",
                          cursor: "pointer",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {form.role === "research_adviser" && (
                    <p style={{
                      fontSize: "0.75rem", color: "#92400e", marginTop: "0.5rem",
                      backgroundColor: "#fef3c7", border: "1px solid #fde68a",
                      padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
                    }}>
                      Adviser accounts require admin approval before you can log in.
                    </p>
                  )}
                </div>
                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Confirm password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Repeat your password"
                    value={form.confirmPassword}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="label">
                    Department <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    className="input"
                    value={form.department_id}
                    onChange={(e) => update("department_id", e.target.value)}
                    required
                  >
                    <option value="">Select your department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} — {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {form.role === "student" && (
                  <>
                    <div>
                      <label className="label">
                        Student ID <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. 2316075"
                        value={form.id_number}
                        onChange={(e) => update("id_number", e.target.value)}
                        required
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label className="label">
                          Year level <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <select
                          className="input"
                          value={form.year_level}
                          onChange={(e) => update("year_level", e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          {YEAR_LEVELS.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">
                          Section <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. A"
                          value={form.section}
                          onChange={(e) => update("section", toUpperCase(e.target.value))}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label">
                        Research Adviser{" "}
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>(optional)</span>
                      </label>
                      <select
                        className="input"
                        value={form.adviser_id}
                        onChange={(e) => update("adviser_id", e.target.value)}
                      >
                        <option value="">Select an adviser</option>
                        {advisers.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </>
            )}

            {error && (
              <div style={{
                backgroundColor: "#fee2e2", border: "1px solid #fecaca",
                color: "#991b1b", fontSize: "0.875rem",
                padding: "0.75rem 1rem", borderRadius: "0.5rem",
              }}>
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); }}
                  className="btn-ghost"
                  style={{ flex: 1 }}
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                {loading
                  ? "Creating account..."
                  : step === 1
                  ? "Continue"
                  : "Create account"}
              </button>
            </div>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.875rem", color: "#64748b", marginTop: "1rem" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#003366", fontWeight: "500" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}