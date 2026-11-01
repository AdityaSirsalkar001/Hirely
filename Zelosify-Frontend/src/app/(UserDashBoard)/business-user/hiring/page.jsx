import { redirect } from "next/navigation";

export default function LegacyHiringPage() {
  redirect("/hiring-manager/openings");
}
