import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { sendAdviserApprovalEmail } from "@/lib/email";

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

    if (action === "approve") {
      const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(adviserId);
      const { data: adviserProfile, error: profileError } = await adminClient
        .from("profiles")
        .select("full_name")
        .eq("id", adviserId)
        .single();

      if (authError || profileError) {
        console.error("[approvals] Could not fetch adviser details for email:", authError || profileError);
      } else {
        await sendAdviserApprovalEmail({
          email: authUser.user.email,
          fullName: adviserProfile.full_name,
        });
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error("Approval error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}