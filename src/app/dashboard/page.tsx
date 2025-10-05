import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import UnifiedCoverageBoard from "@/components/dashboard/unified-coverage-board";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <UnifiedCoverageBoard />;
}
