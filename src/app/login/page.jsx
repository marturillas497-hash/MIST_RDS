"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    const registered = searchParams.get("registered");
    if (err === "account_suspended") {
      setError("Your account has been suspended or rejected. Contact the administrator.");
    }
    if (registered === "student") {
      setSuccess("Account created successfully. Please sign in.");
    }
    if (registered === "adviser") {
      setSuccess("Account created. An admin will review your application before you can sign in.");
    }
  }, [searchParams]);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <div style={{ width: "100%", maxWidth: "22rem" }} className="animate-fade-up">
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{
          fontFamily: "DM Serif Display, Georgia, serif",
          fontSize: "1.75rem", color: "#0f172a",
          marginBottom: "0.25rem", letterSpacing: "-0.02em",
        }}>
          Welcome back
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
          Sign in to your MIST-RDS account
        </p>
      </div>

      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label className="label">Email address</label>
          <input
            type="email"
            className="input"
            placeholder="you@mist.edu.ph"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {success && (
          <div style={{
            backgroundColor: "#d1fae5", border: "1px solid #a7f3d0",
            color: "#065f46", fontSize: "0.875rem",
            padding: "0.75rem 1rem", borderRadius: "0.5rem",
          }}>
            {success}
          </div>
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

        <button
          type="submit"
          disabled={loading}
          className="btn-secondary"
          style={{ width: "100%", marginTop: "0.5rem" }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p style={{ textAlign: "center", fontSize: "0.875rem", color: "#64748b", marginTop: "1.5rem" }}>
        No account yet?{" "}
        <Link href="/register" style={{ color: "#003366", fontWeight: "500" }}>
          Register here
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex" }}>
      {/* Left panel */}
      <div
        style={{
          width: "45%",
          backgroundColor: "#003366",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "3rem",
          position: "relative",
          overflow: "hidden",
        }}
        className="hidden lg:flex"
      >
        {/* Background circles */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.05, pointerEvents: "none" }}>
          <div style={{
            position: "absolute", top: 0, right: 0,
            width: "24rem", height: "24rem", borderRadius: "9999px",
            backgroundColor: "#ffd21a", transform: "translate(50%, -50%)",
          }} />
          <div style={{
            position: "absolute", bottom: 0, left: 0,
            width: "16rem", height: "16rem", borderRadius: "9999px",
            backgroundColor: "#ffd21a", transform: "translate(-50%, 50%)",
          }} />
        </div>

        {/* Top section */}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "4rem" }}>
            <div style={{
              width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem",
              backgroundColor: "#ffcc00", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#001529", fontFamily: "serif", fontSize: "1.125rem", fontWeight: "700" }}>
                M
              </span>
            </div>
            <div>
              <p style={{ color: "#ffcc00", fontWeight: "700", letterSpacing: "0.15em", fontSize: "0.75rem", textTransform: "uppercase" }}>
                MIST
              </p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.625rem", letterSpacing: "0.05em" }}>
                Makilala Institute of Science and Technology
              </p>
            </div>
          </div>

          <h1 style={{
            fontFamily: "DM Serif Display, Georgia, serif",
            fontSize: "2.25rem", color: "#ffffff",
            lineHeight: "1.2", marginBottom: "1rem", letterSpacing: "-0.02em",
          }}>
            Research Discovery System
          </h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.875rem", lineHeight: "1.7", maxWidth: "20rem" }}>
            Validate your research proposals through semantic similarity detection and AI-powered advisory feedback tailored to your department.
          </p>
        </div>

        {/* Bottom features */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            { icon: "◎", label: "Semantic Similarity Detection" },
            { icon: "◈", label: "AI Advisory by Google Gemini" },
            { icon: "◫", label: "Institutional Research Library" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ color: "#ffcc00", fontSize: "1.125rem" }}>{item.icon}</span>
              <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.875rem" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center",
        justifyContent: "center", padding: "3rem 1.5rem",
      }}>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}