"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <div className="w-full max-w-sm animate-fade-up">
      {/* Mobile logo */}
      <div className="flex lg:hidden items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-lg bg-navy-500 flex items-center justify-center">
          <span className="text-gold-500 font-serif text-base font-bold">M</span>
        </div>
        <div>
          <p className="text-xs font-bold text-navy-600 tracking-widest uppercase">MIST-RDS</p>
          <p className="text-[0.625rem] text-slate-400">Research Discovery System</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="font-serif text-3xl text-slate-900 tracking-tight mb-1">
          Welcome back
        </h2>
        <p className="text-sm text-slate-500">Sign in to your MIST-RDS account</p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-secondary w-full mt-1"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        No account yet?{" "}
        <Link href="/register" className="text-navy-500 font-medium hover:text-navy-600 transition-colors">
          Register here
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel — hidden on mobile */}
      <div className="hidden lg:flex w-[45%] bg-navy-500 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background circles */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gold-400 translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-gold-400 -translate-x-1/2 translate-y-1/2" />
        </div>

        {/* Top */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-lg bg-gold-500 flex items-center justify-center">
              <span className="text-navy-900 font-serif text-lg font-bold">M</span>
            </div>
            <div>
              <p className="text-gold-500 font-bold tracking-widest text-xs uppercase">MIST</p>
              <p className="text-white/40 text-[0.625rem] tracking-wide">
                Makilala Institute of Science and Technology
              </p>
            </div>
          </div>

          <h1 className="font-serif text-4xl text-white leading-tight tracking-tight mb-4">
            Research Discovery System
          </h1>
          <p className="text-white/55 text-sm leading-relaxed max-w-xs">
            Validate your research proposals through semantic similarity detection and AI-powered advisory feedback tailored to your department.
          </p>
        </div>

        {/* Bottom features */}
        <div className="relative flex flex-col gap-4">
          {[
            { icon: "◎", label: "Semantic Similarity Detection" },
            { icon: "◈", label: "AI Advisory by Google Gemini" },
            { icon: "◫", label: "Institutional Research Library" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-gold-500 text-lg">{item.icon}</span>
              <span className="text-white/65 text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}