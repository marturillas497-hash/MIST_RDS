export function StatCard({ label, value, icon, sub, accent = false }) {
  return (
    <div style={{
      background: accent ? "linear-gradient(135deg, #003366, #002a52)" : "#ffffff",
      borderRadius: "0.75rem",
      border: accent ? "1px solid #1a4d85" : "1px solid #e2e8f0",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      padding: "1.5rem",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <span style={{ fontSize: "1.5rem", opacity: accent ? 0.8 : 0.6 }}>{icon}</span>
      </div>
      <p style={{
        fontSize: "1.875rem", fontWeight: "700",
        fontFamily: "DM Serif Display, Georgia, serif",
        color: accent ? "#ffffff" : "#0f172a",
        marginBottom: "0.25rem", letterSpacing: "-0.02em",
      }}>
        {value ?? "—"}
      </p>
      <p style={{ fontSize: "0.875rem", fontWeight: "500", color: accent ? "rgba(255,255,255,0.7)" : "#64748b" }}>
        {label}
      </p>
      {sub && (
        <p style={{ fontSize: "0.75rem", marginTop: "0.25rem", color: accent ? "rgba(255,255,255,0.5)" : "#94a3b8" }}>
          {sub}
        </p>
      )}
    </div>
  );
}