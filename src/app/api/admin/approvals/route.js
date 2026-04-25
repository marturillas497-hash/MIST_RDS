import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function PATCH(request) {
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

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { adviserId, action } = await request.json();

    if (!adviserId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const status = action === "approve" ? "active" : "rejected";
    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from("profiles")
      .update({ status })
      .eq("id", adviserId)
      .eq("role", "research_adviser");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error("Approval error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
