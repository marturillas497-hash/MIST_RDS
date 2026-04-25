import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
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

    if (!profile || profile.role !== "research_adviser") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const adminClient = createAdminClient();

    // Get all students assigned to this adviser
    const { data: studentMeta, error } = await adminClient
      .from("student_metadata")
      .select(`
        profile_id,
        id_number,
        year_level,
        section,
        profiles!inner(id, full_name, department_id, departments(code, name))
      `)
      .eq("adviser_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // For each student, get their report count and latest report
    const students = await Promise.all(
      (studentMeta || []).map(async (sm) => {
        const { data: reports } = await adminClient
          .from("similarity_reports")
          .select("id, risk_level, similarity_score, created_at, input_title")
          .eq("student_id", sm.profile_id)
          .order("created_at", { ascending: false })
          .limit(1);

        const { count } = await adminClient
          .from("similarity_reports")
          .select("id", { count: "exact", head: true })
          .eq("student_id", sm.profile_id);

        return {
          profile_id: sm.profile_id,
          full_name: sm.profiles.full_name,
          department: sm.profiles.departments,
          id_number: sm.id_number,
          year_level: sm.year_level,
          section: sm.section,
          report_count: count || 0,
          latest_report: reports?.[0] || null,
        };
      })
    );

    return NextResponse.json({ students });
  } catch (err) {
    console.error("Adviser students error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
