"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StudentSidebar } from "@/components/shared/Sidebar";
import { PageShell, PageHeader } from "@/components/shared/PageShell";
import { generateEmbedding } from "@/lib/embeddings";

const STEPS = [
  { key: "idle", label: "Ready" },
  { key: "embedding", label: "Generating semantic embedding..." },
  { key: "analyzing", label: "Running similarity analysis..." },
  { key: "advisory", label: "Generating AI advisory..." },
  { key: "saving", label: "Saving report..." },
];

export default function SubmitPage({ profile }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [step, setStep] = useState("idle");
  const [error, setError] = useState("");

  const isLoading = step !== "idle";
  const currentStep = STEPS.find((s) => s.key === step);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (title.trim().length < 10) {
      setError("Please enter a more descriptive research title (at least 10 characters).");
      return;
    }
    if (description.trim().length < 50) {
      setError("Please provide a more detailed abstract or problem statement (at least 50 characters).");
      return;
    }

    try {
      setStep("embedding");
      const combinedText = `${title.trim()} ${description.trim()}`;
      const embedding = await generateEmbedding(combinedText);

      setStep("analyzing");
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), embedding }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) {
          setError(data.error);
        } else {
          setError(data.error || "Analysis failed. Please try again.");
        }
        setStep("idle");
        return;
      }

      setStep("saving");
      router.push(`/dashboard/report/${data.reportId}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setStep("idle");
    }
  }

  return (
    <div className="flex">
      <StudentSidebar profile={profile || {}} />
      <PageShell>
        <PageHeader
          title="New Similarity Scan"
          subtitle="Enter your proposed research title and abstract to check for similarity against the institutional library."
        />

        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card p-6 space-y-5">
              <div>
                <label className="label">
                  Proposed Research Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Predictive Analytics for Crop Yield Optimization in Cotabato Province"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  Enter your full proposed research title as you intend to submit it.
                </p>
              </div>

              <div>
                <label className="label">
                  Abstract / Problem Statement <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="input resize-none"
                  rows={8}
                  placeholder="Describe your research problem, objectives, methodology, and expected outcomes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  {description.length} characters {description.length < 50 && description.length > 0 && "— at least 50 required"}
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border-2 border-navy-200 border-t-navy-500 animate-spin flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {currentStep?.label}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      This may take a few seconds on first load while the AI model initializes.
                    </p>
                  </div>
                </div>

                {/* Progress steps */}
                <div className="mt-5 space-y-2">
                  {STEPS.filter((s) => s.key !== "idle").map((s) => {
                    const stepIndex = STEPS.findIndex((x) => x.key === s.key);
                    const currentIndex = STEPS.findIndex((x) => x.key === step);
                    const isDone = stepIndex < currentIndex;
                    const isCurrent = s.key === step;

                    return (
                      <div key={s.key} className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 transition-all ${
                            isDone
                              ? "bg-emerald-500 text-white"
                              : isCurrent
                              ? "bg-navy-500 text-white animate-pulse"
                              : "bg-slate-100 text-slate-300"
                          }`}
                        >
                          {isDone ? "✓" : "·"}
                        </div>
                        <span
                          className={`text-xs ${
                            isCurrent
                              ? "text-slate-700 font-medium"
                              : isDone
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!isLoading && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  The embedding model runs in your browser. First load may take a moment.
                </p>
                <button type="submit" className="btn-primary">
                  Run Semantic Scan →
                </button>
              </div>
            )}
          </form>
        </div>
      </PageShell>
    </div>
  );
}
