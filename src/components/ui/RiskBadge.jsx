const RISK_STYLES = {
  GREEN: {
    badge: { backgroundColor: "#d1fae5", color: "#065f46", border: "1px solid #a7f3d0" },
    dot: "#10b981",
  },
  YELLOW: {
    badge: { backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" },
    dot: "#f59e0b",
  },
  ORANGE: {
    badge: { backgroundColor: "#ffedd5", color: "#9a3412", border: "1px solid #fed7aa" },
    dot: "#f97316",
  },
  RED: {
    badge: { backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" },
    dot: "#ef4444",
  },
};

const SIZE_STYLES = {
  sm: { fontSize: "0.75rem", padding: "0.125rem 0.625rem" },
  md: { fontSize: "0.875rem", padding: "0.25rem 0.75rem" },
  lg: { fontSize: "1rem", padding: "0.375rem 1rem" },
};

export function RiskBadge({ level, size = "sm" }) {
  const style = RISK_STYLES[level] || RISK_STYLES.GREEN;
  const sizeStyle = SIZE_STYLES[size];

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.375rem",
      borderRadius: "9999px", fontWeight: "600",
      ...style.badge, ...sizeStyle,
    }}>
      <span style={{
        width: "0.375rem", height: "0.375rem",
        borderRadius: "9999px", backgroundColor: style.dot,
        flexShrink: 0,
      }} />
      {level}
    </span>
  );
}

export function RiskBar({ score }) {
  const pct = Math.round(score * 100);
  let barColor = "#10b981";
  if (pct >= 80) barColor = "#ef4444";
  else if (pct >= 65) barColor = "#f97316";
  else if (pct >= 45) barColor = "#f59e0b";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Similarity Score</span>
        <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "#0f172a" }}>{pct}%</span>
      </div>
      <div style={{ height: "0.5rem", backgroundColor: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: "9999px",
          backgroundColor: barColor, width: `${pct}%`,
          transition: "width 0.7s ease",
        }} />
      </div>
    </div>
  );
}