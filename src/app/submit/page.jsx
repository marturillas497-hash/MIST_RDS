import { requireStudentOrAdviser } from "@/lib/auth";
import SubmitClient from "./SubmitClient";

export default async function SubmitPage() {
  const profile = await requireStudentOrAdviser();
  return <SubmitClient profile={profile} />;
}