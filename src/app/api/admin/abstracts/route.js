import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await request.json();
    const { title, abstract_text, authors, year, department_id, accession_id, embedding } = body;

    if (!title || !abstract_text || !department_id || !accession_id || !embedding) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("abstracts")
      .insert({
        title,
        abstract_text,
        authors: authors || null,
        year: year ? parseInt(year) : null,
        department_id,
        accession_id,
        embedding,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A research with that title or accession ID already exists." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, abstract: data }, { status: 201 });
  } catch (err) {
    console.error("Add abstract error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

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

    const body = await request.json();
    const { id, title, abstract_text, authors, year, embedding } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing abstract id." }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const updatePayload = {};
    if (title) updatePayload.title = title;
    if (abstract_text) updatePayload.abstract_text = abstract_text;
    if (authors !== undefined) updatePayload.authors = authors;
    if (year) updatePayload.year = parseInt(year);
    if (embedding) updatePayload.embedding = embedding;

    const { data, error } = await adminClient
      .from("abstracts")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, abstract: data });
  } catch (err) {
    console.error("Edit abstract error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(request) {
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

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing abstract id." }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient.from("abstracts").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete abstract error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
