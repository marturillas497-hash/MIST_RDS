import { createClient } from "@/lib/supabase/server";
import { generateAdvisory } from "@/lib/gemini";
import { getRiskLevel } from "@/lib/constants";
import { matchAbstracts } from "@/lib/pgvector";
import { NextResponse } from "next/server";

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

    if (!profile || (profile.role !== "student" && profile.role !== "research_adviser")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const isAdviser = profile.role === "research_adviser";

    /* DEV: Daily scan limit disabled for testing — re-enable before production
    const phtOffset = 8 * 60 * 60 * 1000;
    const nowPHT = new Date(Date.now() + phtOffset);
    const dayStartPHT = new Date(nowPHT);
    dayStartPHT.setUTCHours(0, 0, 0, 0);
    const dayStartUTC = new Date(dayStartPHT.getTime() - phtOffset);

    const scanQuery = supabase
      .from("similarity_reports")
      .select("id", { count: "exact", head: true })
      .gte("created_at", dayStartUTC.toISOString());

    if (isAdviser) {
      scanQuery.eq("adviser_id", user.id).is("student_id", null);
    } else {
      scanQuery.eq("student_id", user.id);
    }

    const { count } = await scanQuery;

    if (count >= 5) {
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

    const topMatches = await matchAbstracts({
      embedding,
      matchThreshold: 0.0,
      matchCount: 5,
    });

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

    const insertPayload = {
      input_title: title,
      input_description: description,
      similarity_score: topScore,
      risk_level: riskLevel,
      ai_recommendations: advisory,
      results_json: resultsJson,
      status: "pending",
    };

    if (isAdviser) {
      insertPayload.student_id = null;
      insertPayload.adviser_id = user.id;
    } else {
      const adviserId =
        profile.student_metadata?.[0]?.adviser_id ||
        profile.student_metadata?.adviser_id ||
        null;
      insertPayload.student_id = user.id;
      insertPayload.adviser_id = adviserId;
    }

    const { data: report, error: reportError } = await supabase
      .from("similarity_reports")
      .insert(insertPayload)
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