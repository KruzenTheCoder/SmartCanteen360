import { redirect } from "next/navigation";

/** Root simply forwards into the dashboard; the dashboard layout enforces auth. */
export default function RootPage() {
  redirect("/dashboard");
}
