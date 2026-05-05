import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, departments(id, code, name), student_metadata!student_metadata_profile_id_fkey(*)")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function requireStudent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, departments(id, code, name), student_metadata!student_metadata_profile_id_fkey(*)")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (profile.role !== "student") redirect("/login");
  if (profile.status !== "active") redirect("/login");
  return profile;
}

export async function requireStudentOrAdviser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, departments(id, code, name), student_metadata!student_metadata_profile_id_fkey(*)")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (profile.role !== "student" && profile.role !== "research_adviser") redirect("/login");
  if (profile.role === "research_adviser" && profile.status === "pending") redirect("/pending");
  if (profile.status !== "active") redirect("/login");
  return profile;
}

export async function requireAdviser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, departments(id, code, name)")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (profile.role !== "research_adviser") redirect("/login");
  if (profile.status === "pending") redirect("/pending");
  if (profile.status !== "active") redirect("/login");
  return profile;
}

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, departments(id, code, name)")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/login");
  return profile;
}