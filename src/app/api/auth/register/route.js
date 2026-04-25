import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    console.log("ENV CHECK:", {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "OK" : "MISSING",
      service: process.env.SUPABASE_SERVICE_ROLE_KEY ? "OK" : "MISSING",
    });

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    console.log("BODY RECEIVED:", { ...body, password: "[REDACTED]" });

    const {
      email,
      password,
      full_name,
      role,
      department_id,
      id_number,
      year_level,
      section,
      adviser_id,
    } = body;

    if (!email || !password || !full_name || !role || !department_id) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    if (!["student", "research_adviser"].includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    let supabase;
    try {
      supabase = createAdminClient();
      console.log("Admin client created OK");
    } catch (clientErr) {
      console.error("Admin client creation failed:", clientErr);
      return NextResponse.json({ error: "Admin client failed: " + clientErr.message }, { status: 500 });
    }

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    console.log("Auth user created:", authData.user.id);

    const userId = authData.user.id;
    const status = role === "research_adviser" ? "pending" : "active";

    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      full_name,
      role,
      department_id,
      status,
    });

    if (profileError) {
      console.error("Profile error:", profileError);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    console.log("Profile created OK");

    if (role === "student") {
      const { error: metaError } = await supabase
        .from("student_metadata")
        .insert({
          profile_id: userId,
          id_number: id_number || null,
          year_level: year_level || null,
          section: section || null,
          adviser_id: adviser_id || null,
        });

      if (metaError) {
        console.error("student_metadata error:", metaError);
        return NextResponse.json({ error: metaError.message }, { status: 400 });
      }

      console.log("Student metadata created OK");
    }

    return NextResponse.json({ success: true, userId }, { status: 201 });
  } catch (err) {
    console.error("Unhandled register error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}