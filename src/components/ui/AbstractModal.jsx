"use client";

import { useEffect, useRef } from "react";

export function AbstractModal({ abstract, departments = [], isAdmin = false, onClose, onEdit, onDelete }) {
  const overlayRef = useRef(null);

  const dept = departments.find((d) => d.id === abstract?.department_id);

  useEffect(() => {
    if (!abstract) return;

    // Track view
    fetch(`/api/abstracts/${abstract.id}/view`, { method: "POST" }).catch(() => {});

    // ESC key to close
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [abstract]);

  if (!abstract) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-up">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              {dept && (
                <span className="badge bg-navy-100 text-navy-700 text-[10px] uppercase tracking-wide">
                  {dept.code}
                </span>
              )}
              {abstract.year && (
                <span className="badge bg-slate-100 text-slate-600 text-[10px]">
                  {abstract.year}
                </span>
              )}
              {abstract.accession_id && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {abstract.accession_id}
                </span>
              )}
            </div>
            <h2 className="font-serif text-xl text-slate-900 leading-snug">
              {abstract.title}
            </h2>
            {abstract.authors && (
              <p className="text-sm text-slate-500 mt-1">{abstract.authors}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Abstract
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {abstract.abstract_text}
          </p>
        </div>

        {/* Footer */}
        {isAdmin && (
          <div className="border-t border-slate-100 p-4 flex items-center justify-end gap-3">
            <button
              onClick={() => onEdit(abstract)}
              className="btn-ghost text-navy-600"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(abstract)}
              className="btn-danger"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
