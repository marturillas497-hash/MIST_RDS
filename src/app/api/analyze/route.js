import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAdvisory } from "@/lib/gemini";
import { getRiskLevel } from "@/lib/constants";
import { NextResponse } from "next/server";

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function POST(request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*, departments(code), student_metadata!student_metadata_profile_id_fkey(adviser_id)")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "student") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    /* DEV: Daily scan limit disabled for testing — re-enable before production
    const phtOffset = 8 * 60 * 60 * 1000;
    const nowPHT = new Date(Date.now() + phtOffset);
    const dayStartPHT = new Date(nowPHT);
    dayStartPHT.setUTCHours(0, 0, 0, 0);
    const dayStartUTC = new Date(dayStartPHT.getTime() - phtOffset);

    const { count } = await supabase
      .from("similarity_reports")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user.id)
      .gte("created_at", dayStartUTC.toISOString());

    if (count >= 3) {
      return NextResponse.json(
        {
          error: "You have reached your daily scan limit. Your scans will reset tomorrow.",
          limitReached: true,
        },
        { status: 429 }
      );
    }
    */

    const body = await request.json();
    const { title, description, embedding } = body;

    if (!title || !description || !embedding) {
      return NextResponse.json(
        { error: "Missing title, description, or embedding." },
        { status: 400 }
      );
    }

    // Fetch all abstracts and compute similarity in JS
    const adminClient = createAdminClient();
    const { data: abstracts, error: fetchError } = await adminClient
      .from("abstracts")
      .select("id, title, abstract_text, authors, year, department_id, accession_id, embedding");

    if (fetchError) {
      console.error("abstracts fetch error:", fetchError);
      return NextResponse.json({ error: "Similarity search failed." }, { status: 500 });
    }

    const scored = abstracts
      .filter((a) => a.embedding)
      .map((a) => {
        const storedEmbedding = typeof a.embedding === "string"
          ? JSON.parse(a.embedding)
          : a.embedding;
        return {
          id: a.id,
          title: a.title,
          abstract_text: a.abstract_text,
          authors: a.authors,
          year: a.year,
          department_id: a.department_id,
          accession_id: a.accession_id,
          similarity: cosineSimilarity(embedding, storedEmbedding),
        };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    const topMatches = scored;
    const topScore = topMatches.length > 0 ? topMatches[0].similarity : 0;
    const riskLevel = getRiskLevel(topScore);
    const departmentCode = profile.departments?.code || "BSIS";

    const advisory = await generateAdvisory({
      title,
      description,
      topMatches,
      riskLevel,
      departmentCode,
      studentName: profile.full_name,
    });

    const resultsJson = topMatches.map((m) => ({
      id: m.id,
      title: m.title,
      abstract_text: m.abstract_text,
      authors: m.authors,
      year: m.year,
      department_id: m.department_id,
      accession_id: m.accession_id,
      similarity: m.similarity,
    }));

    const adviserId =
      profile.student_metadata?.[0]?.adviser_id ||
      profile.student_metadata?.adviser_id ||
      null;

    const { data: report, error: reportError } = await supabase
      .from("similarity_reports")
      .insert({
        student_id: user.id,
        adviser_id: adviserId,
        input_title: title,
        input_description: description,
        similarity_score: topScore,
        risk_level: riskLevel,
        ai_recommendations: JSON.stringify(advisory),
        results_json: resultsJson,
        status: "pending",
      })
      .select()
      .single();

    if (reportError) {
      console.error("Save report error:", reportError);
      return NextResponse.json({ error: "Failed to save report." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reportId: report.id,
      riskLevel,
      similarityScore: topScore,
      matches: resultsJson,
      advisory,
    });
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}