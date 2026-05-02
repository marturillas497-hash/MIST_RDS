import { createClient } from "@/lib/supabase/server";
import { matchAbstracts } from "@/lib/pgvector";
import { NextResponse } from "next/server";

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { embedding, match_threshold, match_count } = await request.json();

  try {
    const matches = await matchAbstracts({
      embedding,
      matchThreshold: match_threshold ?? 0.2,
      matchCount: match_count ?? 20,
    });

    return NextResponse.json({ matches });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}