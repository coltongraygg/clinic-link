import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import SimpleRequestsList from "@/components/requests/simple-requests-list";

export default async function MyRequestsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="pb-24">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <SimpleRequestsList />
      </div>
    </div>
  );
}
