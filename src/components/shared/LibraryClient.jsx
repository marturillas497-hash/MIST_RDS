"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { AbstractModal } from "@/components/ui/AbstractModal";
import { generateEmbedding } from "@/lib/embeddings";

const supabase = createClient();

function AbstractCard({ abstract, departments, onClick }) {
  const dept = departments.find((d) => d.id === abstract.department_id);
  return (
    <button
      onClick={() => onClick(abstract)}
      className="card-hover p-5 text-left w-full group"
    >
      <div className="flex items-center gap-2 mb-2">
        {dept && (
          <span className="badge bg-navy-100 text-navy-700 text-[10px] uppercase tracking-wide">
            {dept.code}
          </span>
        )}
        {abstract.year && (
          <span className="text-[10px] text-slate-400">{abstract.year}</span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-slate-900 group-hover:text-navy-600 transition-colors line-clamp-2 leading-snug mb-2">
        {abstract.title}
      </h3>
      {abstract.authors && (
        <p className="text-xs text-slate-500 truncate mb-2">{abstract.authors}</p>
      )}
      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
        {abstract.abstract_text}
      </p>
    </button>
  );
}

function EditModal({ abstract, onClose, onSave }) {
  const [title, setTitle] = useState(abstract.title || "");
  const [abstractText, setAbstractText] = useState(abstract.abstract_text || "");
  const [authors, setAuthors] = useState(abstract.authors || "");
  const [year, setYear] = useState(abstract.year || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!title.trim() || !abstractText.trim()) {
      setError("Title and abstract text are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const combinedText = `${title.trim()} ${abstractText.trim()}`;
      const embedding = await generateEmbedding(combinedText);

      const res = await fetch("/api/admin/abstracts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: abstract.id,
          title: title.trim(),
          abstract_text: abstractText.trim(),
          authors: authors.trim() || null,
          year: year || null,
          embedding,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save changes.");
        return;
      }

      onSave(data.abstract);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-up">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="font-serif text-lg text-slate-900">Edit Abstract</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label className="label">Research Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
          </div>

          <div>
            <label className="label">Abstract Text <span className="text-red-500">*</span></label>
            <textarea
              className="input resize-none"
              rows={8}
              value={abstractText}
              onChange={(e) => setAbstractText(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Authors</label>
              <input
                type="text"
                className="input"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                disabled={saving}
              />
            </div>
            <div>
              <label className="label">Year</label>
              <input
                type="number"
                className="input"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-4 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Embedding will be regenerated on save.
          </p>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="btn-ghost" disabled={saving}>
              Cancel
            </button>
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LibraryClient({ isAdmin, profile, departments }) {
  const [abstracts, setAbstracts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [searching, setSearching] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("abstracts")
        .select("*")
        .order("created_at", { ascending: false });
      setAbstracts(data || []);
      setFiltered(data || []);
    }
    load();
  }, []);

  const runSearch = useCallback(
    async (q, dept) => {
      let pool = abstracts;
      if (dept) pool = pool.filter((a) => a.department_id === dept);

      if (!q.trim()) {
        setFiltered(pool);
        return;
      }

      if (q.trim().length <= 3) {
        const lower = q.toLowerCase();
        setFiltered(
          pool.filter(
            (a) =>
              a.title.toLowerCase().includes(lower) ||
              a.abstract_text.toLowerCase().includes(lower) ||
              a.authors?.toLowerCase().includes(lower)
          )
        );
      } else {
        setSearching(true);
        try {
          const embedding = await generateEmbedding(q);
          const { data: matches, error: rpcError } = await supabase.rpc("match_abstracts", {
            query_embedding: embedding,
            match_threshold: 0.0,
            match_count: 20,
          });

          if (rpcError) console.error("RPC error:", rpcError.message);

          let results = matches || [];
          if (dept) results = results.filter((a) => a.department_id === dept);
          setFiltered(results);
        } catch (err) {
          console.error("Semantic search error:", err);
          setFiltered(pool);
        } finally {
          setSearching(false);
        }
      }
    },
    [abstracts]
  );

  function handleSearchSubmit(e) {
    e.preventDefault();
    runSearch(query, deptFilter);
  }

  useEffect(() => {
    if (query.trim().length <= 3) {
      runSearch(query, deptFilter);
    }
  }, [query, deptFilter]);

  async function handleDelete(abstract) {
    if (!confirm(`Delete "${abstract.title}"? This cannot be undone.`)) return;
    const res = await fetch("/api/admin/abstracts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: abstract.id }),
    });
    if (res.ok) {
      setAbstracts((prev) => prev.filter((a) => a.id !== abstract.id));
      setFiltered((prev) => prev.filter((a) => a.id !== abstract.id));
      setSelected(null);
    }
  }

  function handleEditSave(updated) {
    setAbstracts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setFiltered((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setEditTarget(null);
  }

  return (
    <>
      <form onSubmit={handleSearchSubmit} className="flex gap-3 mb-6">
        <input
          type="text"
          className="input flex-1"
          placeholder="Search abstracts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="input w-52"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.code}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-secondary px-5" disabled={searching}>
          {searching ? "..." : "Search"}
        </button>
      </form>

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-500">
          {searching ? "Running semantic search..." : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
        </p>
        {query.trim().length > 3 && !searching && (
          <span className="text-[10px] bg-navy-50 text-navy-600 px-2 py-0.5 rounded-full border border-navy-100">
            Semantic search active
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-3xl mb-2 opacity-30">◫</p>
          <p className="text-sm">No abstracts found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <AbstractCard
              key={a.id}
              abstract={a}
              departments={departments}
              onClick={setSelected}
            />
          ))}
        </div>
      )}

      {selected && (
        <AbstractModal
          abstract={selected}
          departments={departments}
          isAdmin={isAdmin}
          onClose={() => setSelected(null)}
          onEdit={(a) => { setEditTarget(a); setSelected(null); }}
          onDelete={handleDelete}
        />
      )}

      {editTarget && (
        <EditModal
          abstract={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleEditSave}
        />
      )}
    </>
  );
}