import { GoogleGenerativeAI } from "@google/generative-ai";
import { DEPARTMENT_CONTEXT, RISK_CONFIG } from "./constants";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

export async function generateAdvisory({
  title,
  description,
  topMatches,
  riskLevel,
  departmentCode,
  studentName,
}) {
  const ctx = DEPARTMENT_CONTEXT[departmentCode] || {
    regulator: "relevant regulatory bodies",
    researchType: "research paper",
    domain: "their field of study",
  };

  const topMatch = topMatches[0];
  const matchList = topMatches
    .map(
      (m, i) =>
        `${i + 1}. "${m.title}" (${Math.round(m.similarity * 100)}% similar)`
    )
    .join("\n");

  const prompt = `You are a research advisory system for Makilala Institute of Science and Technology (MIST). A student has submitted a research proposal and you must provide structured advisory feedback.

STUDENT INFORMATION:
- Department: ${departmentCode} (${ctx.domain})
- Research Type: ${ctx.researchType}
- Relevant Regulator/Agency: ${ctx.regulator}

STUDENT'S PROPOSED RESEARCH:
Title: "${title}"
Abstract/Description: "${description}"

SIMILARITY DETECTION RESULTS:
Risk Level: ${riskLevel}
Top Similar Abstracts Found:
${matchList}

${topMatch ? `Most Similar Existing Study: "${topMatch.title}" at ${Math.round(topMatch.similarity * 100)}% similarity` : "No significant matches found."}

Generate a structured advisory response in the following EXACT JSON format (no markdown, no code blocks, just raw JSON):

{
  "verdict": "One authoritative sentence on whether the student should proceed, pivot, or completely change direction.",
  "critical_analysis": "2-3 sentences explaining the similarity situation, suggesting a geographic pivot (e.g., focus on Makilala, Cotabato, or BARMM region), and a technical differentiator specific to the ${ctx.domain} domain and ${ctx.regulator} context.",
  "proposed_titles": [
    "Professionally formatted unique title 1",
    "Professionally formatted unique title 2",
    "Professionally formatted unique title 3"
  ],
  "alternative_pathways": [
    {
      "title": "Alternative Research Direction 1",
      "description": "1-2 sentences describing this alternative pathway with a different methodology or focus area within ${ctx.domain}."
    },
    {
      "title": "Alternative Research Direction 2",
      "description": "1-2 sentences describing this alternative pathway."
    }
  ]
}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Strip any markdown fences if present
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Gemini API error:", err);
    return getFallbackAdvisory(riskLevel, title, departmentCode);
  }
}

function getFallbackAdvisory(riskLevel, title, departmentCode) {
  const ctx = DEPARTMENT_CONTEXT[departmentCode] || {
    domain: "your field",
    researchType: "research",
  };

  const fallbacks = {
    GREEN: {
      verdict: `Your proposed ${ctx.researchType} appears to be original and may proceed to the proposal development stage.`,
      critical_analysis: `The similarity scan found no significant overlap with existing studies in the library. You are encouraged to strengthen your theoretical framework and ensure your methodology is clearly defined within the context of ${ctx.domain}.`,
    },
    YELLOW: {
      verdict: `Your proposed ${ctx.researchType} has minor overlap with existing work and requires a focused pivot before proceeding.`,
      critical_analysis: `The scan detected moderate similarity with existing studies. Consider narrowing your geographic scope to a specific municipality or barangay in the Cotabato area, or introducing a technology differentiator that is absent in the matched study.`,
    },
    ORANGE: {
      verdict: `Your proposed ${ctx.researchType} has significant overlap and must be substantially revised before it can be considered original.`,
      critical_analysis: `The detected overlap is considerable. You must introduce either a geographic pivot targeting an underrepresented locality, a distinct theoretical framework, or a novel data collection approach specific to ${ctx.domain}.`,
    },
    RED: {
      verdict: `Your proposed ${ctx.researchType} is highly similar to existing work and cannot proceed in its current form.`,
      critical_analysis: `The similarity level raises academic integrity concerns. This proposal must be substantially rewritten with a fundamentally different focus, methodology, or scope before resubmission.`,
    },
  };

  const base = fallbacks[riskLevel] || fallbacks.YELLOW;

  return {
    verdict: base.verdict,
    critical_analysis: base.critical_analysis,
    proposed_titles: [
      `A Localized Study on ${title} in Selected Barangays of Makilala, Cotabato`,
      `Comparative Analysis of ${title}: A Municipal-Level Investigation`,
      `An Empirical Assessment of ${title} in the BARMM Context`,
    ],
    alternative_pathways: [
      {
        title: "Geographic Localization Approach",
        description: `Reframe your study to focus on a specific municipality or province in the Cotabato region, providing localized data that fills a documented gap in ${ctx.domain} research.`,
      },
      {
        title: "Methodological Differentiation",
        description: `Adopt a mixed-methods or longitudinal design that is absent in the matched studies, producing comparative findings with greater academic contribution.`,
      },
    ],
  };
}
