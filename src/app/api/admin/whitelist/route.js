import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

async function verifyAdmin(request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return false;

  const supabase = createAdminClient();

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin";
}

// ---------------------------------------------------------------------------
// POST /api/admin/whitelist
// ---------------------------------------------------------------------------
export async function POST(request) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let csvText;
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No file provided. Send the CSV as a 'file' form field." },
        { status: 400 }
      );
    }

    csvText = await file.text();
  } catch {
    return NextResponse.json(
      { error: "Failed to read the uploaded file." },
      { status: 400 }
    );
  }

  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return NextResponse.json({ error: "The CSV file is empty." }, { status: 400 });
  }

  // Skip header row if present
  const firstToken = lines[0].split(",")[0].trim().toLowerCase();
  const isHeader =
    firstToken === "id_number" ||
    firstToken === "student_id" ||
    firstToken === "studentid" ||
    firstToken === "id" ||
    !/^\d/.test(lines[0]);

  const dataLines = isHeader ? lines.slice(1) : lines;

  if (dataLines.length === 0) {
    return NextResponse.json(
      { error: "CSV has a header but no data rows." },
      { status: 400 }
    );
  }

  const rows = [];
  const invalid = [];

  for (const line of dataLines) {
    const raw = line.split(",")[0].trim();
    if (!raw) continue;
    if (/^[a-zA-Z0-9\-]+$/.test(raw)) {
      rows.push({ id_number: raw });
    } else {
      invalid.push(raw);
    }
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No valid student IDs found in the CSV.", invalid_samples: invalid.slice(0, 5) },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { error: upsertError } = await supabase
    .from("student_whitelist")
    .upsert(rows, { onConflict: "id_number", ignoreDuplicates: true });

  if (upsertError) {
    console.error("Whitelist upsert error:", upsertError);
    return NextResponse.json(
      { error: "Database error while saving IDs." },
      { status: 500 }
    );
  }

  console.log(`Whitelist upload: ${rows.length} IDs processed, ${invalid.length} invalid`);

  return NextResponse.json({
    success: true,
    submitted: rows.length,
    invalid_count: invalid.length,
    invalid_samples: invalid.slice(0, 5),
    message: `${rows.length} ID${rows.length !== 1 ? "s" : ""} processed. Duplicates were ignored.`,
  });
}

// ---------------------------------------------------------------------------
// GET /api/admin/whitelist?search=&page=1&limit=50
// ---------------------------------------------------------------------------
export async function GET(request) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10));
  const offset = (page - 1) * limit;

  const supabase = createAdminClient();

  let query = supabase
    .from("student_whitelist")
    .select("id_number, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.ilike("id_number", `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Whitelist GET error:", error);
    return NextResponse.json({ error: "Failed to fetch whitelist." }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0, page, limit });
}