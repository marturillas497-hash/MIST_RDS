// Risk level calculation from similarity score (0.0 – 1.0)
export function getRiskLevel(score) {
  const pct = score * 100;
  if (pct < 45) return "GREEN";
  if (pct < 65) return "YELLOW";
  if (pct < 80) return "ORANGE";
  return "RED";
}

export const RISK_CONFIG = {
  GREEN: {
    label: "Original",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
    description: "Your research concept appears original.",
  },
  YELLOW: {
    label: "Minor Overlap",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
    description: "Minor overlap detected. Consider a niche pivot.",
  },
  ORANGE: {
    label: "Significant Overlap",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-800",
    dot: "bg-orange-500",
    description: "Significant overlap. A geographic or technical pivot is required.",
  },
  RED: {
    label: "High Similarity",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-800",
    dot: "bg-red-500",
    description: "High similarity detected. Academic integrity concern.",
  },
};

// Department-specific context for Gemini prompts
export const DEPARTMENT_CONTEXT = {
  BSIS: {
    regulator: "NPC (National Privacy Commission)",
    researchType: "Capstone Project",
    domain: "information systems, software development, and data management",
  },
  ACT: {
    regulator: "DICT (Department of Information and Communications Technology)",
    researchType: "Capstone Project",
    domain: "computer technology and applied computing",
  },
  BSE: {
    regulator: "DTI (Department of Trade and Industry)",
    researchType: "Capstone Project",
    domain: "entrepreneurship, business innovation, and market development",
  },
  BSA: {
    regulator: "DA (Department of Agriculture)",
    researchType: "Undergraduate Thesis",
    domain: "agriculture, crop science, and farming systems",
  },
  BSCRIM: {
    regulator: "PNP (Philippine National Police)",
    researchType: "Undergraduate Thesis",
    domain: "criminology, law enforcement, and criminal justice",
  },
  BPA: {
    regulator: "CSC (Civil Service Commission)",
    researchType: "Undergraduate Thesis",
    domain: "public administration, governance, and policy",
  },
  "BS Midwifery": {
    regulator: "DOH (Department of Health)",
    researchType: "Undergraduate Thesis",
    domain: "midwifery, maternal health, and community nursing",
  },
};

export const DEPARTMENTS = [
  { code: "BSA", name: "Bachelor of Science in Agriculture" },
  { code: "BSCRIM", name: "Bachelor of Science in Criminology" },
  { code: "BPA", name: "Bachelor of Public Administration" },
  { code: "BSIS", name: "Bachelor of Science in Information Systems" },
  { code: "BSE", name: "Bachelor of Science in Entrepreneurship" },
  { code: "ACT", name: "Associate in Computer Technology" },
  { code: "BS Midwifery", name: "Bachelor of Science in Midwifery" },
];

export const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
