import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Only record student views
    if (!profile || profile.role !== "student") {
      return NextResponse.json({ success: true });
    }

    const { id } = await params;

    const { error: viewError } = await supabase.from("abstract_views").insert(
      { abstract_id: id, viewer_id: user.id },
      { count: null }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("View tracking error:", err);
    return NextResponse.json({ success: false });
  }
}