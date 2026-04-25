"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function PendingPage() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center animate-fade-up">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
          <span className="text-amber-600 text-2xl">◈</span>
        </div>
        <h1 className="font-serif text-2xl text-slate-900 mb-2">Account Pending</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          Your research adviser account is currently under review. The administrator will approve your application shortly. You will be able to log in once your account is active.
        </p>
        <button onClick={handleSignOut} className="btn-ghost text-slate-500">
          Sign out
        </button>
      </div>
    </div>
  );
}
