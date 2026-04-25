import { requireStudent } from "@/lib/auth";
import SubmitClient from "./SubmitClient";

export default async function SubmitPage() {
  const profile = await requireStudent();
  return <SubmitClient profile={profile} />;
}
