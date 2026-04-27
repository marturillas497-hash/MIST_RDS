import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { embedding, match_threshold, match_count } = await request.json();

  const adminClient = createAdminClient();
  const { data: abstracts, error } = await adminClient
    .from("abstracts")
    .select("id, title, abstract_text, authors, year, department_id, accession_id, embedding");

  if (error) {
    console.error("abstracts fetch error:", error);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }

  const threshold = match_threshold ?? 0.2;
  const limit = match_count ?? 20;

  const results = abstracts
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
    .filter((a) => a.similarity > threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return NextResponse.json({ matches: results });
}